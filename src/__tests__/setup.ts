/**
 * Jest Setup File
 * 
 * This file runs before all tests
 * 
 * The uuid package is an ESM (ES Module) which causes Jest to fail with:
 * "SyntaxError: Cannot use import statement outside a module"
 * 
 * By mocking it, we avoid the ESM import issue and provide predictable UUIDs for testing.
 */

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
}));
