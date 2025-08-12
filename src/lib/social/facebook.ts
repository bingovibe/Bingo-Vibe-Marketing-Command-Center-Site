
import axios from 'axios';

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
}

interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

class FacebookAPI {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;
  private version: string;

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.redirectUri = process.env.FACEBOOK_REDIRECT_URI || '';
    this.version = process.env.FACEBOOK_API_VERSION || 'v18.0';
  }

  // Generate OAuth URL for Facebook Login
  getAuthUrl(): string {
    const scopes = 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_to_groups';
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code',
      state,
    });

    return `https://www.facebook.com/${this.version}/dialog/oauth?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code: string): Promise<FacebookTokenResponse> {
    try {
      const params = new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code,
      });

      const response = await axios.get(`https://graph.facebook.com/${this.version}/oauth/access_token?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Facebook access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get long-lived user access token
  async getLongLivedToken(shortLivedToken: string): Promise<FacebookTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      });

      const response = await axios.get(`https://graph.facebook.com/${this.version}/oauth/access_token?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get long-lived Facebook token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<FacebookUserInfo> {
    try {
      const fields = 'id,name,email,picture';
      const response = await axios.get(`https://graph.facebook.com/${this.version}/me?fields=${fields}&access_token=${accessToken}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Facebook user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user pages
  async getUserPages(accessToken: string): Promise<FacebookPageInfo[]> {
    try {
      const response = await axios.get(`https://graph.facebook.com/${this.version}/me/accounts?access_token=${accessToken}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get Facebook pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create page post
  async createPagePost(pageAccessToken: string, pageId: string, postData: {
    message?: string;
    link?: string;
    picture?: string;
    name?: string;
    caption?: string;
    description?: string;
    published?: boolean;
    scheduled_publish_time?: number;
  }) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/${this.version}/${pageId}/feed`,
        postData,
        {
          params: {
            access_token: pageAccessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create Facebook post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Upload photo to page
  async uploadPagePhoto(pageAccessToken: string, pageId: string, photoData: {
    url?: string;
    source?: any; // File data
    message?: string;
    published?: boolean;
    scheduled_publish_time?: number;
  }) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/${this.version}/${pageId}/photos`,
        photoData,
        {
          params: {
            access_token: pageAccessToken,
          },
          headers: {
            'Content-Type': photoData.source ? 'multipart/form-data' : 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload Facebook photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get page insights
  async getPageInsights(pageAccessToken: string, pageId: string, metrics: string[] = ['page_impressions', 'page_reach', 'page_engaged_users']) {
    try {
      const metricsString = metrics.join(',');
      const response = await axios.get(
        `https://graph.facebook.com/${this.version}/${pageId}/insights?metric=${metricsString}&period=day&access_token=${pageAccessToken}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Facebook insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Debug token to check validity and permissions
  async debugToken(accessToken: string, tokenToDebug: string) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${this.version}/debug_token?input_token=${tokenToDebug}&access_token=${accessToken}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to debug Facebook token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const facebookAPI = new FacebookAPI();
export default facebookAPI;
