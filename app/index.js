// 首页 - 采集入口(同步桌面端,无API配置)
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme, SPACING, RADIUS } from '../lib/theme';
import { addItem, getAllItems } from '../lib/db';
import * as Clipboard from 'expo-clipboard';

export default function HomeScreen() {
  const T = useTheme();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => { loadCount(); }, []);

  async function loadCount() {
    try { const items = await getAllItems(); setSavedCount(items.length); } catch(e){}
  }

  async function handleSave() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      setStep('💾 保存中...');
      await addItem(input.trim(), input.trim(), input.trim(), '', '', [], '手动添加');
      const newCount = savedCount + 1;
      setSavedCount(newCount);
      setStep(`✅ 已保存!共 ${newCount} 条`);
      setInput('');
      loadCount();
      setTimeout(() => setStep(''), 3000);
    } catch(e) { setStep(`❌ ${e.message}`); }
    finally { setLoading(false); }
  }

  async function pasteFromClipboard() {
    const text = await Clipboard.getStringAsync();
    if (text) setInput(text);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={{ padding: SPACING.lg }}>
      <View style={{ backgroundColor: T.primaryLight, padding: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: SPACING.lg, alignItems: 'center' }}>
        <Text style={{ color: T.primary, fontSize: 13 }}>📦 已保存 {savedCount} 条知识</Text>
      </View>

      <Text style={{ fontSize: 22, fontWeight: '700', color: T.text, marginBottom: SPACING.xl }}>💡 采集新知识</Text>

      <TouchableOpacity onPress={pasteFromClipboard} style={{ backgroundColor: T.primaryLight, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg, alignItems: 'center' }}>
        <Text style={{ color: T.primary, fontWeight: '600' }}>📋 从剪贴板粘贴</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 14, color: T.textSecondary, marginBottom: SPACING.sm }}>粘贴内容...</Text>
      <TextInput multiline value={input} onChangeText={setInput}
        placeholder="将内容粘贴到这里,保存到知识库..."
        placeholderTextColor={T.textSecondary}
        style={{ backgroundColor: T.bgInput, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, padding: SPACING.md, minHeight: 200, textAlignVertical: 'top', fontSize: 15, lineHeight: 22 }} />

      <TouchableOpacity onPress={handleSave} disabled={loading}
        style={{ backgroundColor: loading ? T.textSecondary : T.primary, padding: SPACING.lg, borderRadius: RADIUS.md, marginTop: SPACING.xl, alignItems: 'center' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>📥 保存</Text>}
      </TouchableOpacity>

      {step ? (
        <View style={{ marginTop: SPACING.md, padding: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: step.startsWith('❌') ? T.dangerLight : step.startsWith('✅') ? T.successLight : T.primaryLight }}>
          <Text style={{ color: step.startsWith('❌') ? T.danger : step.startsWith('✅') ? T.success : T.primary, fontSize: 13, textAlign: 'center' }}>{step}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
