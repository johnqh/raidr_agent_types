import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  isSuccessResponse,
  isErrorResponse,
  type BaseResponse,
  type HealthCheckData,
  type User,
} from './index';

describe('raidr_agent_types', () => {
  describe('successResponse', () => {
    it('wraps data with success: true and a timestamp', () => {
      const data: HealthCheckData = { status: 'ok', version: '0.0.1' };
      const response = successResponse(data);
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ status: 'ok', version: '0.0.1' });
      expect(typeof response.timestamp).toBe('string');
      expect(new Date(response.timestamp).toISOString()).toBe(
        response.timestamp
      );
    });

    it('accepts null data', () => {
      const response = successResponse(null);
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });
  });

  describe('errorResponse', () => {
    it('wraps an error with success: false', () => {
      const response = errorResponse('User not found');
      expect(response.success).toBe(false);
      expect(response.error).toBe('User not found');
      expect(response.data).toBeUndefined();
    });
  });

  describe('type guards', () => {
    it('isSuccessResponse narrows success responses', () => {
      const response: BaseResponse<HealthCheckData> = successResponse({
        status: 'ok',
        version: '0.0.1',
      });
      expect(isSuccessResponse(response)).toBe(true);
      expect(isErrorResponse(response)).toBe(false);
    });

    it('isErrorResponse narrows error responses', () => {
      const response = errorResponse('boom');
      expect(isErrorResponse(response)).toBe(true);
      expect(isSuccessResponse(response)).toBe(false);
    });
  });

  describe('User', () => {
    it('allows nullable fields', () => {
      const user: User = {
        firebase_uid: 'uid-1',
        email: null,
        display_name: null,
        created_at: null,
        updated_at: null,
      };
      expect(user.firebase_uid).toBe('uid-1');
    });
  });
});
