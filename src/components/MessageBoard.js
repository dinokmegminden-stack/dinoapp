// MessageBoard — üzenőfal a landing bal sávjában, a Napi Dínó alatt. A játékosok
// max 300 karakteres üzenetet hagyhatnak egymásnak / a készítőnek; a beküldő
// beceneve mindig látszik. Nyilvános, becenév-alapú (nincs auth) — a `messages`
// Supabase tábla adja/tárolja (fetch/postMessage).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { fetchMessages, postMessage, setMessageHidden, MESSAGE_MAX_LEN } from '../services/messagesService';

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'most';
  if (s < 3600) return `${Math.floor(s / 60)} perce`;
  if (s < 86400) return `${Math.floor(s / 3600)} órája`;
  return `${Math.floor(s / 86400)} napja`;
}

export default function MessageBoard({ nickname, isAdmin = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages(40, { includeHidden: isAdmin }).then(setMessages);
  }, [isAdmin]);

  const toggleHidden = async (m) => {
    const next = !m.is_hidden;
    const { ok } = await setMessageHidden(m.id, next);
    if (ok) {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_hidden: next } : x)));
    }
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const { data } = await postMessage(nickname, body);
    if (data) {
      setMessages((prev) => [data, ...prev]);
      setText('');
    }
    setSending(false);
  };

  const remaining = MESSAGE_MAX_LEN - text.length;

  return (
    <View>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={(t) => setText(t.slice(0, MESSAGE_MAX_LEN))}
          placeholder={`Üzenet írása${nickname ? ` – ${nickname}` : ''}…`}
          placeholderTextColor="rgba(254,250,224,0.4)"
          multiline
          maxLength={MESSAGE_MAX_LEN}
        />
        <View style={styles.composerRow}>
          <Text style={styles.counter}>{remaining}</Text>
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
          >
            <Text style={styles.sendBtnText}>{sending ? 'Küldés…' : 'Küldés'}</Text>
          </Pressable>
        </View>
      </View>

      {messages.length === 0 ? (
        <Text style={styles.empty}>Még nincs üzenet — legyél te az első!</Text>
      ) : (
        <View style={styles.list}>
          {messages.map((m) => (
            <View key={m.id} style={[styles.msg, m.is_hidden && styles.msgHidden]}>
              <View style={styles.msgHead}>
                <Text style={styles.msgName} numberOfLines={1}>{m.nickname || 'Névtelen'}</Text>
                <Text style={styles.msgTime}>{timeAgo(m.created_at)}</Text>
              </View>
              <Text style={styles.msgBody}>{m.body}</Text>
              {isAdmin && (
                <Pressable style={styles.modBtn} onPress={() => toggleHidden(m)} accessibilityRole="button">
                  <Text style={styles.modBtnText}>{m.is_hidden ? '↩ Visszaállítás' : '✕ Elrejtés'}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    borderRadius: 14,
    backgroundColor: 'rgba(20,18,16,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    padding: 10,
    marginBottom: 12,
  },
  input: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13,
    minHeight: 46,
    maxHeight: 120,
    textAlignVertical: 'top',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  counter: { color: COLORS.cream, opacity: 0.5, fontSize: 11, fontFamily: FONTS.body },
  sendBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: COLORS.bgDark, fontFamily: FONTS.bold, fontSize: 13 },
  empty: { color: COLORS.cream, opacity: 0.6, fontFamily: FONTS.body, fontSize: 12.5, lineHeight: 18 },
  list: { gap: 10 },
  msg: {
    borderRadius: 12,
    backgroundColor: 'rgba(20,18,16,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.07)',
    padding: 11,
  },
  msgHidden: { opacity: 0.5, borderStyle: 'dashed', borderColor: 'rgba(238,155,0,0.4)' },
  modBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(238,155,0,0.16)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  modBtnText: { color: COLORS.accent, fontFamily: FONTS.bold, fontSize: 11 },
  msgHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 },
  msgName: { color: COLORS.accent, fontFamily: FONTS.bold, fontSize: 12.5, flex: 1 },
  msgTime: { color: COLORS.cream, opacity: 0.45, fontSize: 10.5, fontFamily: FONTS.body, marginLeft: 6 },
  msgBody: { color: COLORS.cream, opacity: 0.85, fontFamily: FONTS.body, fontSize: 13, lineHeight: 18 },
});
