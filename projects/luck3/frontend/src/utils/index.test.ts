import { expect, test } from 'vitest';
import { isSameStarknetAddress } from './index';

test('isSameStarknetAddress', () => {
  const isSame = isSameStarknetAddress(
    '0x5769c5a2fac3269d591e4c3b236a8087671d93ed702eba01e501fc088e10535',
    '0x05769c5a2fac3269d591e4c3b236a8087671d93ed702eba01e501fc088e10535'
  );
  expect(isSame).toBe(true);
});
