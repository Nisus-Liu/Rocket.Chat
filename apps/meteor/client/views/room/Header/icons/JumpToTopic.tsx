import { IconButton } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type JumpToTopicProps = {
	messageId: string;
	drid: string;
};

const JumpToTopic = ({ messageId, drid }: JumpToTopicProps) => {
	const router = useRouter();
	const { t } = useTranslation();

	const handleJumpToTopic = () => {
		router.navigate({
			name: 'topics-detail',
			params: { id: messageId },
			search: { drid },
		});
	};

	return (
		<IconButton
			icon='jump'
			title={t('Jump_to_topic')}
			onClick={handleJumpToTopic}
			small
		/>
	);
};

export default JumpToTopic; 