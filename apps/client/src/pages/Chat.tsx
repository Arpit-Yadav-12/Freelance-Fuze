import React, { useState } from 'react';

const Chat: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState('');

  const chats = [
    {
      id: 1,
      user: {
        name: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
        role: 'seller',
      },
      lastMessage: 'I can start working on your project tomorrow.',
      time: '10:30 AM',
      unread: 2,
    },
    {
      id: 2,
      user: {
        name: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
        role: 'buyer',
      },
      lastMessage: 'Thank you for the quick response!',
      time: 'Yesterday',
      unread: 0,
    },
    {
      id: 3,
      user: {
        name: 'Mike Johnson',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
        role: 'seller',
      },
      lastMessage: 'The design is ready for your review.',
      time: '2 days ago',
      unread: 0,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'John Doe',
      content: 'Hi there! How can I help you with your project?',
      time: '10:15 AM',
      isUser: false,
    },
    {
      id: 2,
      sender: 'You',
      content: 'I need a logo design for my new startup.',
      time: '10:20 AM',
      isUser: true,
    },
    {
      id: 3,
      sender: 'John Doe',
      content: 'I can help you with that! What kind of style are you looking for?',
      time: '10:25 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'You',
      content: 'Something modern and minimalist.',
      time: '10:28 AM',
      isUser: true,
    },
    {
      id: 5,
      sender: 'John Doe',
      content: 'I can start working on your project tomorrow.',
      time: '10:30 AM',
      isUser: false,
    },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Handle sending message
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400">Chat with sellers and buyers</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex h-[600px]">
            {/* Chat List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="overflow-y-auto h-[calc(600px-73px)]">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedChat === chat.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                    }`}
                    onClick={() => setSelectedChat(chat.id)}
                  >
                    <div className="relative">
                      <img
                        src={chat.user.avatar}
                        alt={chat.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          chat.user.role === 'seller' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate text-gray-900 dark:text-white">{chat.user.name}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{chat.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    {chat.unread > 0 && (
                      <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        {chat.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                <img
                  src={chats.find((chat) => chat.id === selectedChat)?.user.avatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {chats.find((chat) => chat.id === selectedChat)?.user.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {chats.find((chat) => chat.id === selectedChat)?.user.role ===
                    'seller'
                      ? 'Seller'
                      : 'Buyer'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.isUser
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span
                        className={`text-xs mt-1 block ${
                          msg.isUser ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="btn-primary px-6"
                    disabled={!message.trim()}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 