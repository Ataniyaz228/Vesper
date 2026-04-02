/** @jest-environment node */
import { GET, POST } from '@/app/api/playlists/route';
import * as auth from '@/lib/auth';
import * as db from '@/lib/db';

jest.mock('@/lib/auth', () => ({
    getSessionUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
    query: jest.fn(),
}));

const mockGetSessionUser = auth.getSessionUser as jest.Mock;
const mockQuery = db.query as jest.Mock;

describe('/api/playlists Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET handler', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetSessionUser.mockResolvedValue(null); // Not authenticated
            
            const req = new Request('http://localhost/api/playlists');
            const res = await GET();
            
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('should return playlists if user is authenticated', async () => {
            mockGetSessionUser.mockResolvedValue({ userId: 1, email: 'test@test.com' });
            
            const mockPlaylists = [
                { id: '1', title: 'Late Night', trackCount: 5, coverUrl: 'http://img.com/1.jpg' }
            ];
            mockQuery.mockResolvedValue(mockPlaylists);

            const res = await GET();
            expect(res.status).toBe(200);
            
            const data = await res.json();
            expect(data.playlists).toEqual(mockPlaylists);
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST handler', () => {
        it('should create a new playlist with 0 tracks', async () => {
            mockGetSessionUser.mockResolvedValue({ userId: 1 });
            mockQuery.mockResolvedValue([{ id: 2, title: 'New Playlist', createdAt: '2026-01-01' }]);

            const req = new Request('http://localhost/api/playlists', {
                method: 'POST',
                body: JSON.stringify({ title: 'New Playlist' })
            });

            const res = await POST(req);
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data.playlist.title).toBe('New Playlist');
            expect(data.playlist.trackCount).toBe(0);
        });
    });
});
