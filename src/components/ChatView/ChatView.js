import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import {
	Avatar,
	ChatEmptyMessage,
	ChatItem,
	ChatInput,
} from '../index';

import { addMessageToChat } from '../../features/chat/chatSlice';
import {
	selectChat,
	selectChatItem,
} from '../../features/chat/chatSelectors';

import avatarImage from '../../assets/images/anonymous-avatar.png';
import messageNotification from '../../assets/sounds/message-notification.mp3';

import './ChatView.scss';

export const ChatView = () => {
    const [chatMessage, setChatMessage] = useState('');
    const [randomJokeMessage, setRandomJokeMessage] = useState(null);
    const [isBotMessage, setIsBotMessage] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    // By default, during the first render, the first chat user is set as active
    const selectedChat = useSelector(selectChatItem);
    const { usersData, activeChatId } = useSelector(selectChat);
    const dispatch = useDispatch();

    const timeoutRef = useRef(null);
    const messagesEndRef = useRef(null);

    const audio = new Audio(messageNotification);

    useEffect(() => {
        const controller = new AbortController();

        const axiosRequest = async () => {
            try {
                const { data } = await axios.get('https://api.chucknorris.io/jokes/random/');
                setRandomJokeMessage(data.value);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    // eslint-disable-next-line
                    console.log('Axios Error with Message: ' + error.message);
                } else {
                    // eslint-disable-next-line
                    console.log(error);
                }
            }
        };

        axiosRequest();

        return () => {
            controller.abort();
        };
    }, [isBotMessage]);

    useEffect(() => {
        if (messagesEndRef.current) {
            scrollToBottom();
        }
    }, [usersData]);

    useEffect(() => {
        if (isClicked) {
            timeoutRef.current = setTimeout(() => {
                handleAddMessage(true, activeChatId);
                audio.play();
            }, 5000);

            setIsBotMessage(false);
            setIsClicked(false);
        }
        // eslint-disable-next-line
    }, [isClicked]);

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    const handleInputChange = (e) => {
        setChatMessage(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            if (isDisabled()) {
                return;
            }

            setIsClicked(true);
            setIsBotMessage(true);
            handleAddMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isDisabled = () => {
        return chatMessage.trim().length === 0;
    };

    const getCurrentDateTime = () => {
        const dateObj = new Date();
        const options = {
            hour: 'numeric',
            hour12: true,
            minute: 'numeric',
            second: 'numeric',
        };

        return dateObj.toLocaleDateString('en', options);
    };

    const handleAddMessage = (isRandomAutoresponse, selectedChatId) => {
        if (chatMessage || isRandomAutoresponse) {
            const newMessageItem = {
                key: uuidv4(),
                chatId: selectedChatId ? selectedChatId : activeChatId,
                image: isBotMessage
                    ? selectedChat.profileImage
                    : 'http://emilcarlsson.se/assets/mikeross.png',
                type: isBotMessage ? 'other' : '',
                createdDateTime: getCurrentDateTime(),
                message: isBotMessage ? randomJokeMessage : chatMessage,
            };

            dispatch(addMessageToChat(newMessageItem));
            setChatMessage('');
        }
    };

    return (
        <div className='chat-view'>
            <div className='chat-view__header'>
                <div className='chat-view__profile-wrapper'>
                    <Avatar
                        image={selectedChat?.profileImage ? selectedChat.profileImage : avatarImage}
                        isOnline='active'
                    />
                    <p>{selectedChat?.profileName}</p>
                </div>
            </div>
            <div className='chat-view__items'>
                {selectedChat?.conversation?.length > 0 ? (
                    selectedChat?.conversation?.map((chatItem, index) => (
                        <ChatItem
                            key={chatItem.key}
                            image={chatItem.image}
                            user={chatItem.type ? chatItem.type : 'me'}
                            createdDateTime={chatItem.createdDateTime}
                            message={chatItem.message}
                            animationDelay={index + 2}
                        />
                    ))
                ) : (
                    <ChatEmptyMessage />
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className='chat-view__footer'>
                <ChatInput
                    type='text'
                    className='chat-view__input'
                    placeholder='Type your message'
                    value={chatMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className='chat-view__button'
                    disabled={isDisabled()}
                    onClick={() => {
                        handleAddMessage();
                        setIsClicked(true);
                        setIsBotMessage(true);
                    }}>
                    <svg
                        style={{ width: '24px', height: '24px' }}
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'>
                        <path d='M2,21L23,12L2,3V10L17,12L2,14V21Z' />
                    </svg>
                </button>
            </div>
        </div>
    );
};
