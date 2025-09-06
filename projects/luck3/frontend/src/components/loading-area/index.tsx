import { LoadingOverlay } from '@mantine/core';
import type { PropsWithChildren } from 'react';

export type LoadingAreaProps = {
  className?: string;
  loading?: boolean;
  loaded?: boolean;
};

export function LoadingArea(props: PropsWithChildren<LoadingAreaProps>) {
  console.log('LoadingArea props:', props);
  return (
    <div className={'relative ' + props.className}>
      <LoadingOverlay visible={props.loading} />

      {props.loaded ? props.children : null}
    </div>
  );
}
