import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { editorial } from '../../theme/editorial';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  readingWidth?: boolean;
};

export default function EditorialScreen({ children, scroll = true, refreshing = false, onRefresh, contentStyle, readingWidth = false }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= editorial.layout.desktop;
  const content = (
    <View style={[styles.content, wide && styles.wide, readingWidth && styles.reading, contentStyle]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View pointerEvents="none" style={styles.orbitBackdrop}>
        <View style={styles.orbitGlow} />
        <View style={styles.orbitRing} />
        <View style={styles.orbitCore} />
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={editorial.color.indigo} /> : undefined}
        >
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: editorial.color.canvas, overflow: 'hidden' },
  orbitBackdrop: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orbitGlow: { position: 'absolute', width: 460, height: 460, borderRadius: 230, right: -250, top: -220, backgroundColor: 'rgba(124,92,255,0.12)' },
  orbitRing: { position: 'absolute', width: 330, height: 330, borderRadius: 165, right: -176, top: -122, borderWidth: 1, borderColor: 'rgba(154,137,255,0.24)' },
  orbitCore: { position: 'absolute', width: 10, height: 10, borderRadius: 5, right: 54, top: 86, backgroundColor: editorial.color.coral },
  scroll: { flexGrow: 1, position: 'relative' },
  content: { width: '100%', paddingHorizontal: editorial.layout.mobileGutter, paddingTop: editorial.space.md, paddingBottom: 112, zIndex: 1 },
  wide: { maxWidth: editorial.layout.maxWorkspaceWidth, alignSelf: 'center', paddingHorizontal: editorial.space.xxl },
  reading: { maxWidth: editorial.layout.maxReadingWidth, alignSelf: 'center' },
});
