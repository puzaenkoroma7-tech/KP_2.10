async function fetchRoomMembers() {
  if (!this.accessToken || !this.roomId) return;

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/joined_members`,
      {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      }
    );

    const data = await res.json();

    this.roomMembers = Object.entries(data.joined || {}).map(([userId, info]) => ({
      userId,
      displayName: info.display_name || userId.split(':')[0].substring(1),
      avatarUrl: info.avatar_url
    }));

  } catch (e) {
    console.error('Error fetching room members:', e);
  }
}




function switchRoom(roomId) {
  if (roomId) this.roomId = roomId;

  this.messages = [];
  this.lastSyncToken = '';

  this.fetchMessages();
  this.fetchRoomMembers();
}




async function inviteUserToRoom() {
  if (!this.inviteUser.trim() || !this.roomId) return;

  try {
    await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${this.roomId}/invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({ user_id: this.inviteUser.trim() })
      }
    );

    this.inviteUser = '';
    this.fetchRoomMembers();

  } catch (e) {
    console.error('Invite error:', e);
  }
}




async function joinRoom() {
  if (!this.joinRoomId.trim()) return;

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/join/${encodeURIComponent(this.joinRoomId.trim())}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      }
    );

    const data = await res.json();

    if (data.room_id) {
      this.roomId = this.joinRoomId.trim();
      this.joinRoomId = '';
      this.messages = [];
      this.lastSyncToken = '';

      await this.fetchRoomsWithNames();
      this.fetchMessages();
      this.fetchRoomMembers();
    }

  } catch (e) {
    console.error('Join room error:', e);
  }
}




async function kickUser(userId) {

  if (!this.accessToken || !this.roomId || !userId) return;

  if (!confirm(`Викинути користувача ${userId} з кімнати?`)) return;

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/kick`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({ user_id: userId })
      }
    );

    const data = await res.json();

    if (res.ok) {
      this.roomMembers = this.roomMembers.filter(m => m.userId !== userId);
      alert(`Користувача ${userId} викинуто.`);
      await this.fetchRoomMembers();
    } else {
      alert('Не вдалося викинути користувача: ' + (data.error || 'Невідома помилка'));
    }

  } catch (e) {
    console.error('Kick error:', e);
    alert('Помилка: ' + e.message);
  }
}




async function leaveRoom(roomId) {

  if (!this.accessToken || !roomId) return;

  if (!confirm("Ви впевнені, що хочете покинути (видалити) кімнату?")) return;

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/leave`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      }
    );

    const data = await res.json();

    if (res.ok) {
      this.rooms = this.rooms.filter(r => r.roomId !== roomId);

      if (this.roomId === roomId) {
        this.roomId = '';
        this.messages = [];
        this.roomMembers = [];
      }

      alert('Кімнату покинуто.');
      await this.fetchRoomsWithNames();

    } else {
      alert('Не вдалося покинути кімнату: ' + (data.error || 'Невідома помилка'));
    }

  } catch (e) {
    console.error('Leave room error:', e);
    alert('Помилка: ' + e.message);
  }
}




window.fetchRoomMembers = fetchRoomMembers;
window.inviteUserToRoom = inviteUserToRoom;
window.joinRoom = joinRoom;
window.kickUser = kickUser;
window.leaveRoom = leaveRoom;
window.switchRoom = switchRoom;
