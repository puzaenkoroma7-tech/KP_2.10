async function createRoom() {
  if (!this.newRoomName.trim()) return;
  try {
    const res = await fetch('https://matrix.org/_matrix/client/r0/createRoom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        preset: 'private_chat',
        name: this.newRoomName.trim()
      })
    });

    const data = await res.json();
    if (data.room_id) {
      this.newRoomId = data.room_id;
      this.roomId = data.room_id;

      this.messages = [];
      this.lastSyncToken = '';
      await this.fetchRoomsWithNames();
      this.fetchMessages();
      this.fetchRoomMembers();
    }
  } catch (e) {
    console.error('Create room error:', e);
  }
}

async function fetchRoomsWithNames() {
  if (!this.accessToken) return;

  try {
    const res = await fetch(
      'https://matrix.org/_matrix/client/r0/joined_rooms',
      { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
    );

    const data = await res.json();

    if (data.joined_rooms) {
      const roomPromises = data.joined_rooms.map(async (roomId) => {
        const nameRes = await fetch(
          `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/state/m.room.name`,
          { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
        );

        const nameData = await nameRes.json();
        return {
          roomId,
          name: nameData?.name || this.getRoomName(roomId) || roomId
        };
      });

      this.rooms = (await Promise.all(roomPromises))
        .sort((a, b) => a.roomId.localeCompare(b.roomId));

      if (this.rooms.length > 0 && !this.roomId) {
        this.roomId = this.rooms[0].roomId;
        this.fetchMessages();
        this.fetchRoomMembers();
      }
    }
  } catch (e) {
    console.error('Fetch rooms error:', e);
  }
}

function getRoomName(roomId) {
  return this.rooms.find(r => r.roomId === roomId)?.name || roomId;
}

// ✨ Видалення кімнати (leave)
async function leaveRoom(roomId) {

  if (!this.accessToken || !roomId) return;

  if (!confirm(`Ви впевнені, що хочете покинути (видалити) кімнату?`)) {
    return;
  }

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/leave`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
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
