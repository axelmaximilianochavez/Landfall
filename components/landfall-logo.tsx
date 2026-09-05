import Svg, { Circle, Path } from 'react-native-svg';

type Tone = 'ink' | 'bone';

/**
 * The Landfall mark (design canvas 1a): a globe cut by a horizon, with a
 * flight path arcing down to the point where it touches — the moment of
 * landfall. The orange dot is the same pin used for every mappable point,
 * so the mark and the map share one vocabulary.
 */
export function LandfallLogo({ size = 48, tone = 'ink' }: { size?: number; tone?: Tone }) {
  const stroke = tone === 'ink' ? '#14161A' : '#F7F5EE';
  const arc = tone === 'ink' ? '#4A8EE0' : '#7CF29B';

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="20.5" stroke={stroke} strokeWidth={2.4} />
      <Path d="M4.6 29.5H43.4" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
      <Path
        d="M9 8.5C22 12.5 27.5 19.5 29 28"
        stroke={arc}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Circle cx="29.2" cy="29.5" r="3.6" fill="#FF6A3D" />
    </Svg>
  );
}
