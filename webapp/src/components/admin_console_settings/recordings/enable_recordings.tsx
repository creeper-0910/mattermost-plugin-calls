// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ChangeEvent} from 'react';
import {CustomComponentProps} from 'src/types/mattermost-webapp';
import {useDispatch, useSelector} from 'react-redux';

import {getLicenseConfig} from 'mattermost-redux/actions/general';

import {FormattedMessage} from 'react-intl';

import {adminStats, isCloud, isOnPremNotEnterprise} from 'src/selectors';
import {PrimaryButton} from 'src/components/buttons';
import {HorizontalSpacer, VerticalSpacer} from 'src/components/shared';
import {modals} from 'src/webapp_globals';
import {
    IDOnPremTrialError,
    IDOnPremTrialSuccess,
    OnPremTrialError,
    OnPremTrialSuccess,
} from 'src/components/admin_console_settings/recordings/modals';
import {requestOnPremTrialLicense} from 'src/actions';
import {untranslatable} from 'src/utils';
import manifest from 'src/manifest';

import {
    LabelRow,
    UpgradePill,
    EnterprisePill,
    LeftBox,
    Title,
    Text,
    Footer,
    FooterText,
} from 'src/components/admin_console_settings/common';

const EnableRecordings = (props: CustomComponentProps) => {
    const dispatch = useDispatch();
    const restricted = useSelector(isOnPremNotEnterprise);
    const cloud = useSelector(isCloud);
    const stats = useSelector(adminStats);

    const leftCol = 'col-sm-4';
    const rightCol = 'col-sm-8';

    // Webapp doesn't pass the placeholder setting.
    const placeholder = manifest.settings_schema?.settings.find((e) => e.key === 'EnableRecordings')?.placeholder || '';

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.onChange(props.id, e.target.value === 'true');
    };

    const requestLicense = async () => {
        let users = 0;
        if (stats && (typeof stats.TOTAL_USERS === 'number')) {
            users = stats.TOTAL_USERS;
        }
        const requestedUsers = Math.max(users, 30);

        const {error} = await requestOnPremTrialLicense(requestedUsers, true, true);

        if (error) {
            dispatch(modals.openModal({
                modalId: IDOnPremTrialError,
                dialogType: OnPremTrialError,
            }));
        } else {
            dispatch(modals.openModal({
                modalId: IDOnPremTrialSuccess,
                dialogType: OnPremTrialSuccess,
            }));
            dispatch(getLicenseConfig());
        }
    };

    if (cloud) {
        return null;
    }

    if (restricted) {
        return (
            <div
                data-testid={props.id}
                className='form-group'
            >
                <div className={'control-label ' + leftCol}>
                    <LabelRow>
                        <span>{props.label}</span>
                        <UpgradePill>{untranslatable('Enterprise')}</UpgradePill>
                    </LabelRow>
                </div>
                <div className={rightCol}>
                    <LeftBox>
                        <Title>
                            <FormattedMessage
                                defaultMessage={'Enable call recordings'}
                            />
                        </Title>
                        <VerticalSpacer size={8}/>
                        <Text>
                            <FormattedMessage
                                defaultMessage={'Allow call hosts to record meeting video and audio in the cloud. Recording include the entire call window view along with participants\' audio track and any shared screen video. <featureLink>Learn more about this feature</featureLink>.'}
                                values={{
                                    featureLink: (text: string) => (
                                        <a
                                            href='https://docs.mattermost.com/configure/calls-deployment.html#call-recording'
                                            target='_blank'
                                            rel='noreferrer'
                                        >
                                            {text}
                                        </a>),
                                }}
                            />
                        </Text>
                        <VerticalSpacer size={16}/>
                        <Footer>
                            <div>
                                <PrimaryButton onClick={requestLicense}>
                                    <FormattedMessage defaultMessage={'Try free for 30 days'}/>
                                </PrimaryButton>
                            </div>
                            <HorizontalSpacer size={16}/>
                            <FooterText>
                                <FormattedMessage
                                    defaultMessage={'By selecting <b>Try free for 30 days</b>, I agree to the <linkEvaluation>Mattermost Software Evaluation Agreement</linkEvaluation>, <linkPrivacy>Privacy Policy</linkPrivacy>, and receiving product emails.'}
                                    values={{
                                        b: (text: string) => <b>{text}</b>,
                                        linkEvaluation: (text: string) => (
                                            <a
                                                href='https://mattermost.com/software-evaluation-agreement'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                {text}
                                            </a>
                                        ),
                                        linkPrivacy: (text: string) => (
                                            <a
                                                href='https://mattermost.com/privacy-policy/'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                {text}
                                            </a>
                                        ),
                                    }}
                                />
                            </FooterText>
                        </Footer>
                    </LeftBox>
                </div>
            </div>
        );
    }

    return (
        <div
            data-testid={props.id}
            className='form-group'
        >
            <div className={'control-label ' + leftCol}>
                <LabelRow>
                    <label
                        data-testid={props.id + 'label'}
                        htmlFor={props.id}
                    >
                        {props.label}
                    </label>
                    {!cloud &&
                        <EnterprisePill>{untranslatable('Enterprise')}</EnterprisePill>
                    }
                </LabelRow>
            </div>
            <div className={rightCol}>
                <a id={props.id}/>
                <label className='radio-inline'>
                    <input
                        data-testid={props.id + 'true'}
                        id={props.id + 'true'}
                        type={'radio'}
                        placeholder={placeholder}
                        value='true'
                        checked={Boolean(props.value)}
                        onChange={handleChange}
                        disabled={props.disabled}
                    />
                    <FormattedMessage defaultMessage='true'/>
                </label>

                <label className='radio-inline'>
                    <input
                        data-testid={props.id + 'false'}
                        id={props.id + 'false'}
                        type={'radio'}
                        placeholder={placeholder}
                        value='false'
                        checked={Boolean(!props.value)}
                        onChange={handleChange}
                        disabled={props.disabled}
                    />
                    <FormattedMessage defaultMessage='false'/>
                </label>

                <div
                    data-testid={props.id + 'help-text'}
                    className='help-text'
                >
                    {props.helpText}
                </div>
            </div>
        </div>
    );
};

export default EnableRecordings;
