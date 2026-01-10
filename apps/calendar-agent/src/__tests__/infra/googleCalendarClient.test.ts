/**
 * Tests for Google Calendar API client.
 * Uses nock to mock HTTP requests to Google APIs.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import nock from 'nock';
import { GoogleCalendarClientImpl } from '../../infra/google/googleCalendarClient.js';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com';
const TEST_ACCESS_TOKEN = 'test-access-token';
const TEST_CALENDAR_ID = 'primary';

describe('GoogleCalendarClientImpl', () => {
  let client: GoogleCalendarClientImpl;

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
    client = new GoogleCalendarClientImpl();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('listEvents', () => {
    it('lists events successfully', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events')
        .query(true)
        .reply(200, {
          items: [
            {
              id: 'event-1',
              summary: 'Meeting',
              start: { dateTime: '2025-01-08T10:00:00Z' },
              end: { dateTime: '2025-01-08T11:00:00Z' },
              status: 'confirmed',
            },
            {
              id: 'event-2',
              summary: 'Lunch',
              start: { date: '2025-01-08' },
              end: { date: '2025-01-08' },
              description: 'Team lunch',
              location: 'Restaurant',
            },
          ],
        });

      const result = await client.listEvents(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, {
        timeMin: '2025-01-08T00:00:00Z',
        timeMax: '2025-01-09T00:00:00Z',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.id).toBe('event-1');
        expect(result.value[0]?.summary).toBe('Meeting');
        expect(result.value[0]?.status).toBe('confirmed');
        expect(result.value[1]?.description).toBe('Team lunch');
        expect(result.value[1]?.location).toBe('Restaurant');
      }
    });

    it('returns empty array when no events', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events')
        .query(true)
        .reply(200, { items: undefined });

      const result = await client.listEvents(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, {});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('returns TOKEN_ERROR on 401', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events')
        .query(true)
        .reply(401, {
          error: {
            code: 401,
            message: 'Invalid Credentials',
            errors: [
              {
                message: 'Invalid Credentials',
                domain: 'global',
                reason: 'authError',
              },
            ],
            status: 'UNAUTHENTICATED',
          },
        });

      const result = await client.listEvents(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, {});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TOKEN_ERROR');
      }
    });

    it('handles network errors', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events')
        .query(true)
        .replyWithError('Network error');

      const result = await client.listEvents(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, {});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
      }
    });
  });

  describe('getEvent', () => {
    it('gets event successfully', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Important Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z', timeZone: 'UTC' },
          end: { dateTime: '2025-01-08T11:00:00Z', timeZone: 'UTC' },
          status: 'tentative',
          htmlLink: 'https://calendar.google.com/event?eid=abc',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-02T00:00:00Z',
          organizer: {
            email: 'organizer@example.com',
            displayName: 'John Doe',
            self: false,
          },
          attendees: [
            {
              email: 'attendee@example.com',
              displayName: 'Jane Doe',
              responseStatus: 'accepted',
              optional: false,
              self: true,
            },
          ],
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('event-123');
        expect(result.value.summary).toBe('Important Meeting');
        expect(result.value.status).toBe('tentative');
        expect(result.value.htmlLink).toBe('https://calendar.google.com/event?eid=abc');
        expect(result.value.organizer?.email).toBe('organizer@example.com');
        expect(result.value.attendees).toHaveLength(1);
        expect(result.value.attendees?.[0]?.responseStatus).toBe('accepted');
      }
    });

    it('returns NOT_FOUND on 404', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/nonexistent')
        .reply(404, {
          error: {
            code: 404,
            message: 'Not Found',
            errors: [
              {
                message: 'Not Found',
                domain: 'global',
                reason: 'notFound',
              },
            ],
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('createEvent', () => {
    it('creates event successfully', async () => {
      nock(GOOGLE_CALENDAR_API)
        .post('/calendar/v3/calendars/primary/events')
        .reply(200, {
          id: 'new-event-123',
          summary: 'New Meeting',
          start: { dateTime: '2025-01-10T14:00:00Z' },
          end: { dateTime: '2025-01-10T15:00:00Z' },
          status: 'confirmed',
        });

      const result = await client.createEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, {
        summary: 'New Meeting',
        start: { dateTime: '2025-01-10T14:00:00Z' },
        end: { dateTime: '2025-01-10T15:00:00Z' },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('new-event-123');
        expect(result.value.summary).toBe('New Meeting');
      }
    });

    it('returns INVALID_REQUEST on 400', async () => {
      nock(GOOGLE_CALENDAR_API)
        .post('/calendar/v3/calendars/primary/events')
        .reply(400, {
          error: {
            code: 400,
            message: 'Bad Request',
            errors: [
              {
                message: 'Bad Request',
                domain: 'global',
                reason: 'badRequest',
              },
            ],
          },
        });

      const result = await client.createEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, {
        summary: 'Test',
        start: { dateTime: 'invalid' },
        end: { dateTime: 'invalid' },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_REQUEST');
      }
    });
  });

  describe('updateEvent', () => {
    it('updates event successfully', async () => {
      nock(GOOGLE_CALENDAR_API)
        .patch('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Updated Meeting',
          start: { dateTime: '2025-01-10T14:00:00Z' },
          end: { dateTime: '2025-01-10T15:00:00Z' },
        });

      const result = await client.updateEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123', {
        summary: 'Updated Meeting',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.summary).toBe('Updated Meeting');
      }
    });

    it('returns NOT_FOUND when event does not exist', async () => {
      nock(GOOGLE_CALENDAR_API)
        .patch('/calendar/v3/calendars/primary/events/nonexistent')
        .reply(404, {
          error: {
            code: 404,
            message: 'Not Found',
            errors: [
              {
                message: 'Not Found',
                domain: 'global',
                reason: 'notFound',
              },
            ],
          },
        });

      const result = await client.updateEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'nonexistent', {
        summary: 'Test',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('deleteEvent', () => {
    it('deletes event successfully', async () => {
      nock(GOOGLE_CALENDAR_API)
        .delete('/calendar/v3/calendars/primary/events/event-123')
        .reply(204);

      const result = await client.deleteEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
    });

    it('returns NOT_FOUND when event does not exist', async () => {
      nock(GOOGLE_CALENDAR_API)
        .delete('/calendar/v3/calendars/primary/events/nonexistent')
        .reply(404, {
          error: {
            code: 404,
            message: 'Not Found',
            errors: [
              {
                message: 'Not Found',
                domain: 'global',
                reason: 'notFound',
              },
            ],
          },
        });

      const result = await client.deleteEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getFreeBusy', () => {
    it('returns free/busy information successfully', async () => {
      nock(GOOGLE_CALENDAR_API)
        .post('/calendar/v3/freeBusy')
        .reply(200, {
          calendars: {
            primary: {
              busy: [
                { start: '2025-01-08T10:00:00Z', end: '2025-01-08T11:00:00Z' },
                { start: '2025-01-08T14:00:00Z', end: '2025-01-08T15:00:00Z' },
              ],
            },
            'secondary@example.com': {
              busy: [{ start: '2025-01-08T09:00:00Z', end: '2025-01-08T10:00:00Z' }],
            },
          },
        });

      const result = await client.getFreeBusy(TEST_ACCESS_TOKEN, {
        timeMin: '2025-01-08T00:00:00Z',
        timeMax: '2025-01-09T00:00:00Z',
        items: [{ id: 'primary' }, { id: 'secondary@example.com' }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const primarySlots = result.value.get('primary');
        expect(primarySlots).toHaveLength(2);
        expect(primarySlots?.[0]?.start).toBe('2025-01-08T10:00:00Z');

        const secondarySlots = result.value.get('secondary@example.com');
        expect(secondarySlots).toHaveLength(1);
      }
    });

    it('defaults to primary calendar when no items specified', async () => {
      nock(GOOGLE_CALENDAR_API)
        .post('/calendar/v3/freeBusy')
        .reply(200, {
          calendars: {
            primary: {
              busy: [],
            },
          },
        });

      const result = await client.getFreeBusy(TEST_ACCESS_TOKEN, {
        timeMin: '2025-01-08T00:00:00Z',
        timeMax: '2025-01-09T00:00:00Z',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.get('primary')).toEqual([]);
      }
    });

    it('handles empty calendars response', async () => {
      nock(GOOGLE_CALENDAR_API)
        .post('/calendar/v3/freeBusy')
        .reply(200, { calendars: undefined });

      const result = await client.getFreeBusy(TEST_ACCESS_TOKEN, {
        timeMin: '2025-01-08T00:00:00Z',
        timeMax: '2025-01-09T00:00:00Z',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.size).toBe(0);
      }
    });

    it('handles busy slots with missing start/end', async () => {
      nock(GOOGLE_CALENDAR_API)
        .post('/calendar/v3/freeBusy')
        .reply(200, {
          calendars: {
            primary: {
              busy: [{ start: undefined, end: undefined }],
            },
          },
        });

      const result = await client.getFreeBusy(TEST_ACCESS_TOKEN, {
        timeMin: '2025-01-08T00:00:00Z',
        timeMax: '2025-01-09T00:00:00Z',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const slots = result.value.get('primary');
        expect(slots?.[0]?.start).toBe('');
        expect(slots?.[0]?.end).toBe('');
      }
    });

    it('returns error on API failure', async () => {
      nock(GOOGLE_CALENDAR_API)
        .post('/calendar/v3/freeBusy')
        .reply(500, { message: 'Internal error' });

      const result = await client.getFreeBusy(TEST_ACCESS_TOKEN, {
        timeMin: '2025-01-08T00:00:00Z',
        timeMax: '2025-01-09T00:00:00Z',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
      }
    });
  });

  describe('event mapping edge cases', () => {
    it('handles event with cancelled status', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Cancelled Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          status: 'cancelled',
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe('cancelled');
      }
    });

    it('handles event with minimal fields', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Minimal Event',
          start: {},
          end: {},
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('event-123');
        expect(result.value.start).toEqual({});
        expect(result.value.end).toEqual({});
      }
    });

    it('handles attendee with all response statuses', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          attendees: [
            { email: 'a@example.com', responseStatus: 'needsAction' },
            { email: 'b@example.com', responseStatus: 'declined' },
            { email: 'c@example.com', responseStatus: 'tentative' },
            { email: 'd@example.com', responseStatus: 'accepted' },
            { email: 'e@example.com', responseStatus: 'unknown' },
          ],
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.attendees?.[0]?.responseStatus).toBe('needsAction');
        expect(result.value.attendees?.[1]?.responseStatus).toBe('declined');
        expect(result.value.attendees?.[2]?.responseStatus).toBe('tentative');
        expect(result.value.attendees?.[3]?.responseStatus).toBe('accepted');
        expect(result.value.attendees?.[4]?.responseStatus).toBeUndefined();
      }
    });

    it('handles event without organizer', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          organizer: null,
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.organizer).toBeUndefined();
      }
    });

    it('returns QUOTA_EXCEEDED on 403 with quotaExceeded reason', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(403, {
          error: {
            code: 403,
            message: 'Quota exceeded',
            errors: [{ reason: 'quotaExceeded', message: 'Quota exceeded' }],
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('QUOTA_EXCEEDED');
      }
    });

    it('handles server errors', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(500, {
          error: {
            code: 500,
            message: 'Internal Server Error',
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
      }
    });

    it('returns QUOTA_EXCEEDED on 403 with rateLimitExceeded reason', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(403, {
          error: {
            code: 403,
            message: 'Rate limit exceeded',
            errors: [{ reason: 'rateLimitExceeded', message: 'Rate limit exceeded' }],
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('QUOTA_EXCEEDED');
      }
    });

    it('returns PERMISSION_DENIED on 403 with other reason', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(403, {
          error: {
            code: 403,
            message: 'Access denied',
            errors: [{ reason: 'forbidden', message: 'Access denied' }],
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED');
      }
    });

    it('returns PERMISSION_DENIED on 403 without errors array', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(403, {
          error: {
            code: 403,
            message: 'Forbidden',
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED');
      }
    });

    it('handles event with all start/end fields', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Complex Event',
          start: {
            dateTime: '2025-01-08T10:00:00Z',
            date: '2025-01-08',
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: '2025-01-08T11:00:00Z',
            date: '2025-01-08',
            timeZone: 'America/New_York',
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.start.dateTime).toBe('2025-01-08T10:00:00Z');
        expect(result.value.start.date).toBe('2025-01-08');
        expect(result.value.start.timeZone).toBe('America/New_York');
        expect(result.value.end.dateTime).toBe('2025-01-08T11:00:00Z');
        expect(result.value.end.date).toBe('2025-01-08');
        expect(result.value.end.timeZone).toBe('America/New_York');
      }
    });

    it('handles event with only date in start/end', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'All-day Event',
          start: {
            date: '2025-01-08',
          },
          end: {
            date: '2025-01-09',
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.start.date).toBe('2025-01-08');
        expect(result.value.start.dateTime).toBeUndefined();
        expect(result.value.start.timeZone).toBeUndefined();
        expect(result.value.end.date).toBe('2025-01-09');
      }
    });

    it('handles event with only timeZone in start/end', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Event with TZ',
          start: {
            timeZone: 'Europe/London',
          },
          end: {
            timeZone: 'Europe/London',
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.start.timeZone).toBe('Europe/London');
        expect(result.value.start.dateTime).toBeUndefined();
        expect(result.value.start.date).toBeUndefined();
      }
    });

    it('handles event with organizer having only email', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          organizer: {
            email: 'organizer@example.com',
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.organizer?.email).toBe('organizer@example.com');
        expect(result.value.organizer?.displayName).toBeUndefined();
        expect(result.value.organizer?.self).toBeUndefined();
      }
    });

    it('handles event with organizer having only displayName', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          organizer: {
            displayName: 'John Doe',
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.organizer?.displayName).toBe('John Doe');
        expect(result.value.organizer?.email).toBeUndefined();
        expect(result.value.organizer?.self).toBeUndefined();
      }
    });

    it('handles event with organizer having only self=true', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          organizer: {
            self: true,
          },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.organizer?.self).toBe(true);
        expect(result.value.organizer?.email).toBeUndefined();
        expect(result.value.organizer?.displayName).toBeUndefined();
      }
    });

    it('handles event with organizer as undefined', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          organizer: undefined,
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.organizer).toBeUndefined();
      }
    });

    it('handles attendee with optional=true', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          attendees: [
            {
              email: 'attendee@example.com',
              optional: true,
            },
          ],
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.attendees?.[0]?.optional).toBe(true);
      }
    });

    it('handles event with invalid status value', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
          status: 'unknown',
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBeUndefined();
      }
    });

    it('handles event without attendees field', async () => {
      nock(GOOGLE_CALENDAR_API)
        .get('/calendar/v3/calendars/primary/events/event-123')
        .reply(200, {
          id: 'event-123',
          summary: 'Meeting',
          start: { dateTime: '2025-01-08T10:00:00Z' },
          end: { dateTime: '2025-01-08T11:00:00Z' },
        });

      const result = await client.getEvent(TEST_ACCESS_TOKEN, TEST_CALENDAR_ID, 'event-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.attendees).toBeUndefined();
      }
    });
  });
});
