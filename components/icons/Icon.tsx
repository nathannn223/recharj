import React from 'react';
import Svg, { Path, Circle, Polygon, SvgProps } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
};

const strokeProps = {
  fill: 'none' as const,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Base({ size = 24, color = '#F4F1FC', children, ...rest }: IconProps & { children: React.ReactNode } & SvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      {children}
    </Svg>
  );
}

// Ported from the Recharj identity sprite (see identity artifact <symbol id="i-*">).

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 11 12 4 20 11" stroke={props.color ?? '#F4F1FC'} {...strokeProps} />
      <Path d="M6 10v9h12v-9" stroke={props.color ?? '#F4F1FC'} {...strokeProps} />
      <Path d="M10 19v-5h4v5" stroke={props.color ?? '#F4F1FC'} {...strokeProps} />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M3 5h18a0 0 0 0 1 0 0v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a0 0 0 0 1 0 0z" stroke={c} {...strokeProps} />
      <Path d="M3 9h18" stroke={c} {...strokeProps} />
      <Path d="M8 3v4M16 3v4" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function BookIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M4 5c0-1.1.9-2 2-2h6v18H6c-1.1 0-2-.9-2-2z" stroke={c} {...strokeProps} />
      <Path d="M20 5c0-1.1-.9-2-2-2h-6v18h6c1.1 0 2-.9 2-2z" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function LockIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M5 11h14v9H5z" stroke={c} {...strokeProps} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M5 13l4 4L19 7" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function BoltIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Polygon points="13,2 4,14 11,14 9,22 20,9 12,9" fill={c} stroke="none" />
    </Base>
  );
}

export function MoonIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M17 12.8A7.2 7.2 0 1 1 11.2 5 5.7 5.7 0 0 0 17 12.8z" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M9 5l7 7-7 7" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M15 5l-7 7 7 7" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M6 6l12 12M18 6L6 18" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M12 5v14M5 12h14" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function TrashIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M4 7h16" stroke={c} {...strokeProps} />
      <Path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={c} {...strokeProps} />
      <Path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke={c} {...strokeProps} />
      <Path d="M10 11v6M14 11v6" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function PencilIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M4 20h4L19 9a2.5 2.5 0 0 0-4-4L4 16z" stroke={c} {...strokeProps} />
      <Path d="M14.5 5.5 18.5 9.5" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function StarIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10 Z" fill={c} stroke="none" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Circle cx={11} cy={11} r={7} stroke={c} {...strokeProps} />
      <Path d="M21 21l-4.35-4.35" stroke={c} {...strokeProps} />
    </Base>
  );
}

export function SettingsIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={3.4} stroke={c} {...strokeProps} />
      <Path
        d="M12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"
        stroke={c}
        {...strokeProps}
      />
    </Base>
  );
}

export function UserIcon(props: IconProps) {
  const c = props.color ?? '#F4F1FC';
  return (
    <Base {...props}>
      <Circle cx={12} cy={8} r={4} stroke={c} {...strokeProps} />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={c} {...strokeProps} />
    </Base>
  );
}
