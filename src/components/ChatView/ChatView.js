import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { ChatItem } from '../ui/ChatItem';
import { ChatInput } from '../ui/ChatInput';
import { Avatar } from '../ui/Avatar';
import { addMessageToChat } from '../../features/chat/chatSlice';
import messageNotification from '../../assets/sounds/message-notification.mp3';

import './ChatView.scss';

const ChatView = () => {
	const [chatMessage, setChatMessage] = useState('');
	const [randomJokeMessage, setRandomJokeMessage] = useState(null);
	const [isBotMessage, setIsBotMessage] = useState(false);
	const [isClicked, setIsClicked] = useState(false);

	let timeoutRef = useRef(null);
	let messagesEndRef = useRef(null);

	// By default, the first chat user is set as active
	const selectedChat = useSelector((state) => {
		return state.chat.usersData.find((userItem) => userItem.id === state.chat.activeChatId)
	});
	const { usersData } = useSelector((state) => state.chat);
	const dispatch = useDispatch();

	const audio = new Audio(messageNotification);

	useEffect(() => {
		const controller = new AbortController();

		const axiosRequest = async () => {
			try {
				const { data } = await axios.get('https://api.chucknorris.io/jokes/random/');
				setRandomJokeMessage(data.value);
			} catch (error) {
				if (axios.isAxiosError(error)) {
					console.log('Axios Error with Message: ' + error.message);
				} else {
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

			if (timeoutRef.current) {
				// Clear the running timer and start a new one each time the user clicks
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				handleAddMessage(true);
				audio.play();
			}, 5000);

			setIsBotMessage(false);
			setIsClicked(false);
		}
		// eslint-disable-next-line
	}, [isClicked]);

	const handleInputChange = (e) => {
		setChatMessage(e.target.value);
	};

	const handleKeyDown = (e) => {
		if (e.keyCode === 13) {

			if (isDisabled()) {
				return
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
		const options = { hour: 'numeric', hour12: true, minute: 'numeric' };

		return dateObj.toLocaleDateString('en', options);
	};

	const handleAddMessage = (isRandomAutoresponse) => {
		if (chatMessage || isRandomAutoresponse) {
			const newMessageItem = {
				key: uuidv4(),
				image: isBotMessage ? selectedChat.profileImage : 'http://emilcarlsson.se/assets/mikeross.png',
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
					{selectedChat && (
						<>
							<Avatar
								image={selectedChat.profileImage}
								isOnline='active'
							/>
							<p>{selectedChat.profileName}</p>
						</>
					)}
				</div>
			</div>
			<div className='chat-view__items'>
				{selectedChat.conversation.length === 0 ? (
					<p className='chat-view__empty-message'>No messages here yet...</p>
				) : (
					<>
						{selectedChat.conversation &&
							selectedChat.conversation.map((chatItem, index) => (
								<ChatItem
									key={chatItem.key}
									image={chatItem.image}
									user={chatItem.type ? chatItem.type : 'me'}
									createdDateTime={chatItem.createdDateTime}
									message={chatItem.message}
									animationDelay={index + 2}
								/>
							))
						}
					</>
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
					}}
				>
					<svg
						style={{ width: '24px', height: '24px' }}
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path d='M2,21L23,12L2,3V10L17,12L2,14V21Z' />
					</svg>
				</button>
			</div>
		</div>
	);
};

export { ChatView };