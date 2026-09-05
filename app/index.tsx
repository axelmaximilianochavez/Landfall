import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { LandfallLogo } from '@/components/landfall-logo';
import { TopoBackdrop } from '@/components/topo-backdrop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useOnboardingSeen } from '@/lib/onboarding';

/** The dashed arc with a pin at each end, from the design's login artboard. */
function FlightPath() {
  const { width } = useWindowDimensions();
  const height = (500 / 402) * width;
  return (
    <View style={{ position: 'absolute', top: 80, left: 0, width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 402 500">
        <Path
          d="M40 300 C 120 160, 250 150, 340 260"
          stroke="#4A8EE0"
          strokeWidth={2}
          strokeDasharray="6 7"
          fill="none"
        />
        <Circle cx={40} cy={300} r={7} fill="#FF6A3D" />
        <Circle cx={340} cy={260} r={7} fill="#FF6A3D" />
      </Svg>
    </View>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { seen } = useOnboardingSeen();

  const cardOpacity = useSharedValue(1);
  const cardLift = useSharedValue(0);
  const leaving = useRef(false);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
    transform: [{ translateY: cardLift.get() }],
  }));

  // No authentication yet — both buttons just navigate. `replace` rather than
  // `push` so the back gesture cannot return to the login screen.
  //
  // First-time users get the intro first. `seen` is undefined until the flag
  // has been read; treat that as "seen" so a slow read can never block sign-in.
  const goToNextScreen = () => router.replace(seen === false ? '/onboarding' : '/dashboard');

  const signIn = () => {
    if (leaving.current) return;
    leaving.current = true;
    // .set()/.get() rather than .value — the React Compiler (enabled in
    // app.json) treats a plain assignment as mutating immutable state.
    const timing = { duration: 280, easing: Easing.out(Easing.cubic) };
    cardLift.set(withTiming(24, timing));
    cardOpacity.set(
      withTiming(0, timing, (finished) => {
        if (finished) runOnJS(goToNextScreen)();
      })
    );
  };

  return (
    <View className="flex-1 justify-end">
      <LinearGradient colors={['#DCE5DD', '#EFEBE2']} style={StyleSheet.absoluteFill} />
      <TopoBackdrop />
      <FlightPath />

      <View className="absolute left-0 right-0 top-[180px] items-center gap-[14px]">
        <LandfallLogo size={60} />
        <Text variant="h1" className="text-[30px] leading-[30px]">
          Landfall
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={sheetStyle}>
          {/* The sheet sits at 90% opacity over the gradient, as designed. */}
          <View className="gap-4 rounded-t-[32px] bg-background/90 px-6 pb-[46px] pt-7">
            <View className="gap-[5px]">
              <Text variant="h1">Welcome back</Text>
              <Text variant="body" className="text-muted-foreground text-[14px]">
                Sign in to continue to Landfall.
              </Text>
            </View>

            <View className="gap-[7px]">
              <Text variant="label">Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <View className="gap-[7px]">
              <Text variant="label">Password</Text>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={signIn}
              />
            </View>

            <Button size="block" onPress={signIn}>
              <Text>Log in</Text>
            </Button>

            <View className="flex-row items-center gap-3">
              <View className="bg-input h-px flex-1" />
              <Text variant="caption" className="text-[12px]">
                or
              </Text>
              <View className="bg-input h-px flex-1" />
            </View>

            <Button variant="outline" size="block" onPress={signIn}>
              <Text>Continue with Google</Text>
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
