// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"encoding/json"
	"net/http"

	"github.com/mattermost/mattermost-plugin-calls/server/telemetry"
)

const (
	// server-side events
	evCallStarted     = "call_started"
	evCallEnded       = "call_ended"
	evCallUserJoined  = "call_user_joined"
	evCallUserLeft    = "call_user_left"
	evCallNotifyAdmin = "call_notify_admin"
)

var (
	telemetryClientTypes  = []string{"web", "mobile", "desktop"}
	telemetryClientEvents = []string{
		"user_open_expanded_view",
		"user_close_expanded_view",
		"user_open_participants_list",
		"user_close_participants_list",
		"user_share_screen",
		"user_unshare_screen",
		"user_raise_hand",
		"user_lower_hand",
		"user_open_channel_link",
	}
	telemetryClientTypesMap  map[string]struct{}
	telemetryClientEventsMap map[string]struct{}
)

func init() {
	telemetryClientEventsMap = make(map[string]struct{}, len(telemetryClientEvents))
	for _, eventType := range telemetryClientEvents {
		telemetryClientEventsMap[eventType] = struct{}{}
	}
	telemetryClientTypesMap = make(map[string]struct{}, len(telemetryClientTypes))
	for _, clientType := range telemetryClientTypes {
		telemetryClientTypesMap[clientType] = struct{}{}
	}
}

type trackEventRequest struct {
	Event      string                 `json:"event"`
	ClientType string                 `json:"clientType"`
	Source     string                 `json:"source"`
	Props      map[string]interface{} `json:"props"`
}

func (p *Plugin) track(ev string, props map[string]interface{}) {
	p.mut.RLock()
	defer p.mut.RUnlock()
	if p.telemetry == nil {
		return
	}
	if err := p.telemetry.Track(ev, props); err != nil {
		p.LogError(err.Error())
	}
}

func (p *Plugin) uninitTelemetry() error {
	p.mut.Lock()
	defer p.mut.Unlock()
	if p.telemetry == nil {
		return nil
	}
	if err := p.telemetry.Close(); err != nil {
		return err
	}
	return nil
}

func (p *Plugin) initTelemetry(enableDiagnostics *bool) error {
	p.mut.Lock()
	defer p.mut.Unlock()
	if p.telemetry == nil && enableDiagnostics != nil && *enableDiagnostics {
		p.LogDebug("Initializing telemetry")
		// setup telemetry
		client, err := telemetry.NewClient(telemetry.ClientConfig{
			WriteKey:     rudderWriteKey,
			DataplaneURL: rudderDataplaneURL,
			DiagnosticID: p.API.GetDiagnosticId(),
			DefaultProps: map[string]interface{}{
				"ServerVersion": p.API.GetServerVersion(),
				"PluginVersion": manifest.Version,
				"PluginBuild":   buildHash,
			},
		})
		if err != nil {
			return err
		}
		p.telemetry = client
	} else if p.telemetry != nil && (enableDiagnostics == nil || !*enableDiagnostics) {
		p.LogDebug("Deinitializing telemetry")
		// destroy telemetry
		if err := p.telemetry.Close(); err != nil {
			return err
		}
		p.telemetry = nil
	}
	return nil
}

func (p *Plugin) handleTrackEvent(w http.ResponseWriter, r *http.Request) {
	var res httpResponse
	defer p.httpAudit("handleTrackEvent", &res, w, r)

	p.mut.RLock()
	telemetryEnabled := p.telemetry != nil
	p.mut.RUnlock()

	if !telemetryEnabled {
		res.Err = "telemetry is disabled"
		res.Code = http.StatusBadRequest
		return
	}

	var data trackEventRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, requestBodyMaxSizeBytes)).Decode(&data); err != nil {
		res.Err = err.Error()
		res.Code = http.StatusBadRequest
		return
	}

	if _, ok := telemetryClientEventsMap[data.Event]; !ok {
		res.Err = "invalid telemetry event"
		res.Code = http.StatusBadRequest
		return
	}

	if _, ok := telemetryClientTypesMap[data.ClientType]; !ok {
		res.Err = "invalid client type"
		res.Code = http.StatusBadRequest
		return
	}

	if data.Props == nil {
		data.Props = map[string]interface{}{}
	}

	if data.Source != "" {
		data.Props["Source"] = data.Source
	}

	data.Props["ActualUserID"] = r.Header.Get("Mattermost-User-Id")
	data.Props["ClientType"] = data.ClientType

	p.track(data.Event, data.Props)

	res.Code = http.StatusOK
	res.Msg = "success"
}
