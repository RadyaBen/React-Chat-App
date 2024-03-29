import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
	ChatListBox,
	ChatListItems,
	SearchMessage,
} from '../index';

import { selectedChatId } from '../../features/chat/chatSlice';
import { selectChat } from '../../features/chat/chatSelectors';

import './ChatList.scss';

export const ChatList = () => {
    const { filteredUsersData, activeChatId } = useSelector(selectChat);
    const dispatch = useDispatch();

    const [currentActiveChatId, setCurrentActiveChatId] = useState(activeChatId);

    const handleActiveChat = (id) => {
        // Save the current id, which was received from the child's class, to the state
        setCurrentActiveChatId(id);
        dispatch(selectedChatId(id));
    };

    const sortedUsersData = useMemo(() => {
        return Object.values([...filteredUsersData]).sort((a, b) => {
            // Convert the date to timestamps in milliseconds
            const latestCreatedAtA = Date.parse(new Date(a.conversation.at(-1)?.createdDateTime));
            const latestCreatedAtB = Date.parse(new Date(b.conversation.at(-1)?.createdDateTime));

            // Check for the NaN values first and sort them to the bottom.
            // Then sort by timestamps in milliseconds in descending order
            return (
                !isNaN(latestCreatedAtB) - !isNaN(latestCreatedAtA) ||
                latestCreatedAtB - latestCreatedAtA
            );
        });
    }, [filteredUsersData]);

    return (
        <div className='chatlist'>
            <ChatListBox />
            <div className='chatlist__header'>
                <h1>Chats</h1>
            </div>
            <div className='chatlist__items'>
                {sortedUsersData.length > 0 ? (
                    sortedUsersData?.map((chat, index) => (
                        <ChatListItems
                            {...chat}
                            key={chat.id}
                            activeChatId={currentActiveChatId}
                            isOnline={chat.isOnline ? 'active' : ''}
                            animationDelay={index + 1}
                            onActiveChatClick={handleActiveChat}
                        />
                    ))
                ) : (
                    <SearchMessage />
                )}
            </div>
        </div>
    );
};
