import { lazy, useMemo } from 'react';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useRoom } from '../../views/room/contexts/RoomContext';
import { useTranslation } from 'react-i18next'

const Info = lazy(() => import('../../views/room/contextualBar/Info'));

export const useRoomForwardTopicAction = () => {
    const router = useRouter();
    const room = useRoom();
    const { t } = useTranslation();
    console.log('==room-forward-topic  room', room);
    return useMemo(
        (): RoomToolboxActionConfig => ({
            id: 'room-forward-topic',
            type: 'customization', // :: 枚举, 无 'topics'
            groups: ['channel', 'group'],
            anonymous: true,
            full: true,
            title: 'Topic',
            icon: 'arrow-forward',
            // tabComponent: Info,
            order: 9,
            action: () => {
                // console.log('==room-forward-topic  action');
                const url = router.buildRoutePath({
                    name: 'topics-detail',
                    params: { id: room._id },
                    search: { rid: room._id}
                });
                window.open(url, '_blank');
            },
            // 隐藏"..."动作 renderToolboxItem 无效
            // renderToolboxItem: ({ id, icon, title, disabled, className }) => (
            //     <Box
            //         onClick={() => {
            //             console.log('room-forward-topic');
            //         }}
            //     >
            //         <Box>
            //             {title}
            //         </Box>
            //         <Icon name='arrow-forward' />
            //     </Box>
            // ),
        }),
        [],
    );
};