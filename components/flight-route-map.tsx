import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { WORLD_LAND_PATH } from '@/assets/world-map-path';
import { Text } from '@/components/ui/text';
import {
  greatCirclePath,
  routeViewBox,
  toSvgPath,
  unwrapPath,
  type LatLng,
} from '@/lib/geo';

const WIDTH_TO_HEIGHT = 390 / 190;

/**
 * The route between two airports, drawn rather than tiled.
 *
 * A tile map needs a provider, a key and a live native surface, and gives
 * nothing back at this size — the useful information is "a long way south-west
 * across Asia", which an outline shows perfectly well. Drawing it also means
 * it works identically on iOS, Android and web, with no account to set up.
 *
 * The line follows the great circle, so it bows the way the flight does.
 */
export function FlightRouteMap({
  from,
  to,
  fromLabel,
  toLabel,
}: {
  from: LatLng;
  to: LatLng;
  fromLabel?: string | null;
  toLabel?: string | null;
}) {
  const path = unwrapPath(greatCirclePath(from, to, 96));
  const box = routeViewBox(path, WIDTH_TO_HEIGHT);
  const start = path[0];
  const end = path[path.length - 1];

  // Copies of the world either side, so a route running past the dateline
  // still has land under it.
  const copies = [-360, 0, 360, 720].filter(
    (offset) => offset + 360 > box.x && offset < box.x + box.width
  );

  // Marks stay a constant size on screen however far the view is zoomed.
  const scale = box.height / 190;
  const dot = 4.5 * scale;

  return (
    <View className="border-border h-[190px] overflow-hidden rounded-2xl border">
      <Svg
        width="100%"
        height="100%"
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x={box.x} y={box.y} width={box.width} height={box.height} fill="#E8EDF0" />
        {copies.map((offset) => (
          <G key={offset} transform={`translate(${offset} 0)`}>
            <Path d={WORLD_LAND_PATH} fill="#DCDDD3" stroke="#CFD1C6" strokeWidth={0.2 * scale} />
          </G>
        ))}

        <Path
          d={toSvgPath(path)}
          stroke="#4A8EE0"
          strokeWidth={1.6 * scale}
          strokeDasharray={`${4 * scale},${3.5 * scale}`}
          strokeLinecap="round"
          fill="none"
        />

        <G>
          <Circle cx={start.x} cy={start.y} r={dot * 2} fill="#4A8EE0" opacity={0.2} />
          <Circle cx={start.x} cy={start.y} r={dot} fill="#4A8EE0" stroke="#FFFFFF" strokeWidth={dot * 0.35} />
        </G>
        <G>
          <Circle cx={end.x} cy={end.y} r={dot * 2} fill="#FF6A3D" opacity={0.2} />
          <Circle cx={end.x} cy={end.y} r={dot} fill="#FF6A3D" stroke="#FFFFFF" strokeWidth={dot * 0.35} />
        </G>
      </Svg>

      {fromLabel && toLabel ? (
        <View className="bg-background/90 absolute bottom-2 left-2 rounded-full px-3 py-[6px]">
          <Text variant="monoSm">
            {fromLabel} → {toLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
