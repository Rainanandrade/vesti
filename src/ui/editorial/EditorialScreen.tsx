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
  safe: { flex: 1, backgroundColor: editorial.color.canvas },
  scroll: { flexGrow: 1 },
  content: { width: '100%', paddingHorizontal: editorial.layout.mobileGutter, paddingTop: editorial.space.md, paddingBottom: 112 },
  wide: { maxWidth: editorial.layout.maxWorkspaceWidth, alignSelf: 'center', paddingHorizontal: editorial.space.xxl },
  reading: { maxWidth: editorial.layout.maxReadingWidth, alignSelf: 'center' },
});
