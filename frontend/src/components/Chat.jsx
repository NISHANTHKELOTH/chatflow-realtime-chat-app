import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Backend URL from frontend .env
const API_URL = import.meta.env.VITE_API_URL;

const socket = io(API_URL);

function Chat({ user, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Connect logged-in user to Socket.IO
  useEffect(() => {
    const registerUser = () => {
      console.log("Socket connected:", socket.id);
      socket.emit("register_user", user.id);
    };

    if (socket.connected) {
      registerUser();
    }

    socket.on("connect", registerUser);

    // Receive message from another user
    const receiveMessage = (newMessage) => {
      console.log("RECEIVED MESSAGE:", newMessage);

      // Our own message is already added when we send it
      if (newMessage.senderId === user.id) {
        return;
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        newMessage,
      ]);
    };

    socket.on("receive_private_message", receiveMessage);

    return () => {
      socket.off("connect", registerUser);
      socket.off("receive_private_message", receiveMessage);
    };
  }, [user.id]);

  // Get contacts
  const getContacts = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/users/${user.id}/contacts`
      );

      const data = await response.json();

      if (response.ok) {
        setContacts(data);
      }
    } catch (error) {
      console.error("GET CONTACTS ERROR:", error);
    }
  };

  // Load contacts when chat opens
  useEffect(() => {
    getContacts();
  }, [user.id]);

  // Open Add User popup
  const openAddUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);

      const data = await response.json();

      const otherUsers = data.filter(
        (person) => person._id !== user.id
      );

      setAllUsers(otherUsers);
      setShowAddUser(true);
    } catch (error) {
      console.error("GET USERS ERROR:", error);
    }
  };

  // Add a user to contacts
  const addUser = async (contactId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/users/${user.id}/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contactId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await getContacts();
        setShowAddUser(false);
        setAddSearch("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("ADD USER ERROR:", error);
    }
  };

  // Load old messages from MongoDB
  const loadMessages = async (person) => {
    try {
      const response = await fetch(
        `${API_URL}/api/messages/${user.id}/${person._id}`
      );

      const data = await response.json();

      if (response.ok) {
        const formattedMessages = data.map((msg) => ({
          _id: msg._id,
          senderId: msg.sender,
          receiverId: msg.receiver,
          message: msg.message,
          time: msg.createdAt,
        }));

        setMessages(formattedMessages);
      } else {
        console.error("Could not load messages");
      }
    } catch (error) {
      console.error("LOAD MESSAGES ERROR:", error);
    }
  };

  // Select a user and load conversation
  const selectUser = (person) => {
    setSelectedUser(person);
    loadMessages(person);
  };

  // Send private message
  const sendMessage = (e) => {
    e.preventDefault();

    if (!message.trim() || !selectedUser) {
      return;
    }

    const messageData = {
      senderId: user.id,
      receiverId: selectedUser._id,
      senderUsername: user.username,
      message: message.trim(),
      time: new Date().toISOString(),
    };

    console.log("SENDING MESSAGE:", messageData);

    // Show message immediately
    setMessages((previousMessages) => [
      ...previousMessages,
      messageData,
    ]);

    // Send message to backend
    socket.emit("private_message", messageData);

    // Clear input
    setMessage("");
  };

  // Search contacts
  const filteredContacts = contacts.filter((person) =>
    person.username
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Search users in Add User popup
  const filteredAddUsers = allUsers.filter((person) => {
    const text = addSearch.toLowerCase();

    return (
      person.username.toLowerCase().includes(text) ||
      person.email.toLowerCase().includes(text)
    );
  });

  // Messages for currently selected conversation
  const conversationMessages = selectedUser
    ? messages.filter(
        (msg) =>
          (msg.senderId === user.id &&
            msg.receiverId === selectedUser._id) ||
          (msg.senderId === selectedUser._id &&
            msg.receiverId === user.id)
      )
    : [];

  return (
    <div className="private-chat-page">
      <div className="private-chat-container">

        {/* Left sidebar */}
        <div className="chat-sidebar">

          <div className="sidebar-header">
            <div>
              <h2>💬 ChatFlow</h2>
              <p>{user.username}</p>
            </div>

            <button
              className="sidebar-logout"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>

          {/* Search chats */}
          <div className="user-search">
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="add-user-button"
            onClick={openAddUser}
          >
            + Add User
          </button>

          <p className="chats-title">CHATS</p>

          {/* Contact list */}
          <div className="users-list">

            {filteredContacts.length === 0 ? (
              <div className="no-users">
                <p>No chats yet</p>

                <span>
                  Click + Add User to start chatting.
                </span>
              </div>
            ) : (
              filteredContacts.map((person) => (
                <div
                  key={person._id}
                  className={
                    selectedUser?._id === person._id
                      ? "user-item active-user"
                      : "user-item"
                  }
                  onClick={() => selectUser(person)}
                >
                  <div className="user-avatar">
                    {person.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="user-info">
                    <h4>{person.username}</h4>
                    <p>{person.email}</p>
                  </div>
                </div>
              ))
            )}

          </div>
        </div>

        {/* Right chat area */}
        <div className="private-message-area">

          {selectedUser ? (
            <>

              {/* Chat header */}
              <div className="conversation-header">

                {/* Mobile Back Button */}
                <button
                  className="mobile-back-button"
                  onClick={() => setSelectedUser(null)}
                >
                  ←
                </button>

                <div className="conversation-user">

                  <div className="user-avatar">
                    {selectedUser.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>{selectedUser.username}</h3>
                    <p>{selectedUser.email}</p>
                  </div>

                </div>
              </div>

              {/* Messages */}
              <div className="private-messages">

                {conversationMessages.length === 0 ? (
                  <div className="conversation-start">

                    <div className="large-avatar">
                      {selectedUser.username
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <h2>{selectedUser.username}</h2>

                    <p>
                      Send a message to start your conversation.
                    </p>

                  </div>
                ) : (
                  conversationMessages.map(
                    (msg, index) => {

                      const isMine =
                        msg.senderId === user.id;

                      return (
                        <div
                          key={msg._id || index}
                          className={
                            isMine
                              ? "message-row my-message-row"
                              : "message-row other-message-row"
                          }
                        >

                          <div
                            className={
                              isMine
                                ? "message-bubble my-message"
                                : "message-bubble other-message"
                            }
                          >

                            <p>{msg.message}</p>

                            <span className="message-time">
                              {new Date(
                                msg.time
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>

                          </div>

                        </div>
                      );
                    }
                  )
                )}

              </div>

              {/* Message input */}
              <form
                className="private-message-form"
                onSubmit={sendMessage}
              >

                <input
                  type="text"
                  placeholder={`Message ${selectedUser.username}...`}
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                />

                <button type="submit">
                  Send ➤
                </button>

              </form>

            </>
          ) : (
            <div className="select-chat">

              <div className="select-chat-icon">
                💬
              </div>

              <h1>ChatFlow</h1>

              <p>
                Select a user from the left to start chatting.
              </p>

            </div>
          )}

        </div>
      </div>

      {/* Add User popup */}
      {showAddUser && (
        <div className="modal-background">

          <div className="add-user-modal">

            <div className="modal-header">

              <h2>Add User</h2>

              <button
                onClick={() =>
                  setShowAddUser(false)
                }
              >
                ×
              </button>

            </div>

            <input
              className="modal-search"
              type="text"
              placeholder="Search username or email..."
              value={addSearch}
              onChange={(e) =>
                setAddSearch(e.target.value)
              }
            />

            <div className="modal-users">

              {filteredAddUsers.length === 0 ? (
                <p className="modal-empty">
                  No users found
                </p>
              ) : (
                filteredAddUsers.map((person) => {

                  const alreadyAdded =
                    contacts.some(
                      (contact) =>
                        contact._id === person._id
                    );

                  return (
                    <div
                      className="modal-user"
                      key={person._id}
                    >

                      <div className="user-avatar">
                        {person.username
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="modal-user-info">
                        <h4>{person.username}</h4>
                        <p>{person.email}</p>
                      </div>

                      <button
                        disabled={alreadyAdded}
                        onClick={() =>
                          addUser(person._id)
                        }
                      >
                        {alreadyAdded
                          ? "Added"
                          : "Add"}
                      </button>

                    </div>
                  );
                })
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Chat;