import { useEffect, Suspense, useSyncExternalStore } from 'react';

import DocumentTitleWrapper from './DocumentTitleWrapper';
import PageLoading from './PageLoading';
import { useCodeHighlight } from './hooks/useCodeHighlight';
import { useEscapeKeyStroke } from './hooks/useEscapeKeyStroke';
import { useGoogleTagManager } from './hooks/useGoogleTagManager';
import { useLoadMissedMessages } from './hooks/useLoadMissedMessages';
import { useLoginViaQuery } from './hooks/useLoginViaQuery';
import { useMessageLinkClicks } from './hooks/useMessageLinkClicks';
import { useSettingsOnLoadSiteUrl } from './hooks/useSettingsOnLoadSiteUrl';
import { useWordPressOAuth } from './hooks/useWordPressOAuth';
import { useCorsSSLConfig } from '../../../app/cors/client/useCorsSSLConfig';
import { useDolphin } from '../../../app/dolphin/client/hooks/useDolphin';
import { useDrupal } from '../../../app/drupal/client/hooks/useDrupal';
import { useEmojiOne } from '../../../app/emoji-emojione/client/hooks/useEmojiOne';
import { useGitHubEnterpriseAuth } from '../../../app/github-enterprise/client/hooks/useGitHubEnterpriseAuth';
import { useGitLabAuth } from '../../../app/gitlab/client/hooks/useGitLabAuth';
import { useLivechatEnterprise } from '../../../app/livechat-enterprise/hooks/useLivechatEnterprise';
import { useNextcloud } from '../../../app/nextcloud/client/useNextcloud';
import { useTokenPassAuth } from '../../../app/tokenpass/client/hooks/useTokenPassAuth';
import { useNotificationPermission } from '../../hooks/notification/useNotificationPermission';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAnalyticsEventTracking } from '../../hooks/useAnalyticsEventTracking';
import { useAutoupdate } from '../../hooks/useAutoupdate';
import { useLoadRoomForAllowedAnonymousRead } from '../../hooks/useLoadRoomForAllowedAnonymousRead';
import { appLayout } from '../../lib/appLayout';
import { useCustomOAuth } from '../../sidebar/hooks/useCustomOAuth';
import { useRedirectToSetupWizard } from '../../startup/useRedirectToSetupWizard';

const AppLayout = () => {
	useEffect(() => {
		document.body.classList.add('color-primary-font-color', 'rcx-content--main');

		return () => {
			document.body.classList.remove('color-primary-font-color', 'rcx-content--main');
		};
	}, []);

	useMessageLinkClicks();
	useGoogleTagManager();
	useAnalytics();
	useEscapeKeyStroke();
	useAnalyticsEventTracking();
	useLoadRoomForAllowedAnonymousRead();
	useNotificationPermission();
	useEmojiOne();
	useRedirectToSetupWizard();
	useSettingsOnLoadSiteUrl();
	useLivechatEnterprise();
	useNextcloud();
	useGitLabAuth();
	useGitHubEnterpriseAuth();
	useDrupal();
	useDolphin();
	useTokenPassAuth();
	useWordPressOAuth();
	useCustomOAuth();
	useCorsSSLConfig();
	useAutoupdate();
	useCodeHighlight();
	useLoginViaQuery();
	useLoadMissedMessages();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot); // :: React 18 的 useSyncExternalStore Hook，用于安全地订阅外部数据源（这里是 appLayout 的状态）  自动同步 appLayout 状态, 更新组件重新渲染

	return (
		<Suspense fallback={<PageLoading />}>
			<DocumentTitleWrapper>{layout}</DocumentTitleWrapper>
		</Suspense>
	);
};

export default AppLayout;
