
import axios from 'axios';

interface InstagramTokenResponse {
  access_token: string;
  user_id: number;
}

interface InstagramUserInfo {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

class InstagramAPI {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '';
  }

  // Generate OAuth URL for Instagram Basic Display
  getAuthUrl(): string {
    const scopes = 'user_profile,user_media';
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code',
      state,
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code: string): Promise<InstagramTokenResponse> {
    try {
      const formData = new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code,
      });

      const response = await axios.post('https://api.instagram.com/oauth/access_token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Instagram access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get long-lived access token (60 days)
  async getLongLivedToken(shortLivedToken: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.appSecret,
        access_token: shortLivedToken,
      });

      const response = await axios.get(`https://graph.instagram.com/access_token?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get long-lived Instagram token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<InstagramUserInfo> {
    try {
      const fields = 'id,username,account_type,media_count';
      const response = await axios.get(`https://graph.instagram.com/me?fields=${fields}&access_token=${accessToken}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Instagram user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user media
  async getUserMedia(accessToken: string, limit: number = 25) {
    try {
      const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
      const response = await axios.get(
        `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Instagram media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // For Instagram Business accounts - create media container
  async createMediaContainer(accessToken: string, mediaData: {
    image_url?: string;
    video_url?: string;
    caption?: string;
    location_id?: string;
    user_tags?: Array<{ username: string; x: number; y: number }>;
  }) {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        ...mediaData,
      });

      const response = await axios.post(`https://graph.instagram.com/me/media`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create Instagram media container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Publish media container
  async publishMedia(accessToken: string, creationId: string) {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        creation_id: creationId,
      });

      const response = await axios.post(`https://graph.instagram.com/me/media_publish`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to publish Instagram media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Refresh long-lived token
  async refreshToken(accessToken: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: accessToken,
      });

      const response = await axios.get(`https://graph.instagram.com/refresh_access_token?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to refresh Instagram token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const instagramAPI = new InstagramAPI();
export default instagramAPI;
