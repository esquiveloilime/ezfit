import { type ReactNode, type Ref, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, spacing } from './tokens';

type Props = {
  title?: string;
  children: ReactNode;
  /** Desactivar cuando el contenido ya es una lista con su propio desplazamiento. */
  scroll?: boolean;
  ref?: Ref<ScreenHandle>;
};

/** Acciones que una pantalla puede pedirle a `Screen`. */
export type ScreenHandle = {
  /** Desplaza hasta el campo que tiene el cursor, por ejemplo después de enfocarlo por un error. */
  scrollToFocused: () => void;
  /** Desplaza hasta que `view` (que debe estar dentro de la pantalla) quede arriba. */
  scrollToView: (view: View) => void;
};

// Espacio que se deja arriba del campo al desplazarse hacia él, para que también se vea su etiqueta.
const FIELD_MARGIN = 48;
// Tiempo para que la pantalla termine de encogerse antes de desplazarse.
const SETTLE_MS = 100;

export function Screen({ title, children, scroll = true, ref }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  const scrollToFocused = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    const content = contentRef.current;
    if (!input || !content) return;
    input.measureLayout(
      content,
      (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - FIELD_MARGIN), animated: true }),
      () => undefined,
    );
  }, []);

  const scrollToView = useCallback((view: View) => {
    const content = contentRef.current;
    if (!content) return;
    view.measureLayout(
      content,
      (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.sm), animated: true }),
      () => undefined,
    );
  }, []);

  useImperativeHandle(ref, () => ({ scrollToFocused, scrollToView }), [scrollToFocused, scrollToView]);

  // Al abrir el teclado, se desplaza hasta el campo que se está llenando para que no quede tapado.
  useEffect(() => {
    if (!scroll) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      timer = setTimeout(scrollToFocused, SETTLE_MS);
    });
    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, [scroll, scrollToFocused]);

  const header = title ? (
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* La pantalla se encoge al aparecer el teclado, para que nada quede debajo de él. */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        {scroll ? (
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
            <View ref={contentRef} style={styles.content}>
              {header}
              {children}
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill]}>
            {header}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  fill: { flex: 1 },
  title: { fontSize: font.heading, fontWeight: '700', color: colors.text },
});
