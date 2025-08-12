
import axios from 'axios';

interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
}

class TikTokAPI {
  private clientKey: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
    this.redirectUri = process.env.TIKTOK_REDIRECT_URI || '';
  }

  // Generate OAuth URL for user authorization
  getAuthUrl(): string {
    const scopes = 'user.info.basic,video.list,video.upload';
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_key: this.clientKey,
      response_type: 'code',
      scope: scopes,
      redirect_uri: this.redirectUri,
      state,
    });

    return `https://www.tiktok.com/auth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code: string): Promise<TikTokTokenResponse> {
    try {
      const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.error_description || 'TikTok API error');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get TikTok access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      const response = await axios.get('https://open-api.tiktok.com/user/info/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          fields: 'open_id,union_id,avatar_url,display_name',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'TikTok API error');
      }

      return response.data.data.user;
    } catch (error) {
      throw new Error(`Failed to get TikTok user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Upload video to TikTok
  async uploadVideo(accessToken: string, videoData: {
    video_url: string;
    post_info: {
      title: string;
      description?: string;
      privacy_level: 'MUTUAL_FOLLOW_FRIEND' | 'FOLLOWER_OF_CREATOR' | 'EVERYONE';
      disable_duet: boolean;
      disable_comment: boolean;
      disable_stitch: boolean;
      video_cover_timestamp_ms?: number;
    };
    source_info: {
      source: string;
      post_url: string;
    };
  }) {
    try {
      const response = await axios.post('https://open-api.tiktok.com/share/video/upload/', videoData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'TikTok upload error');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to upload to TikTok: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
    try {
      const response = await axios.post('https://open-api.tiktok.com/oauth/refresh_token/', {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.error_description || 'TikTok API error');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to refresh TikTok token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const tiktokAPI = new TikTokAPI();
export default tiktokAPI;
