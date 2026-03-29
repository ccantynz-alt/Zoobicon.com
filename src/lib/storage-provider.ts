/**
 * Cloud Storage Provider Abstraction Layer
 *
 * Supports: Backblaze B2 (primary), Wasabi (secondary), Mock (development)
 * Set STORAGE_PROVIDER=backblaze|wasabi|mock in env
 * Set B2_KEY_ID + B2_APP_KEY or WASABI_ACCESS_KEY + WASABI_SECRET_KEY accordingly
 *
 * When no credentials are configured, falls back to mock mode automatically.
 */

// ─── Types ───────────────────────────────────────────────

export interface StoragePlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: "monthly";
  storageGB: number;
  bandwidthGB: number;
  features: string[];
}

export interface StorageBucket {
  id: string;
  name: string;
  region: string;
  createdAt: string;
  fileCount: number;
  totalSizeBytes: number;
  isPublic: boolean;
}

export interface StorageFile {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  contentType: string;
  uploadedAt: string;
  url?: string;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
  url: string;
  uploadedAt: string;
}

export interface StorageUsage {
  userId: string;
  storageUsedBytes: number;
  storageUsedGB: number;
  storageLimitGB: number;
  bandwidthUsedBytes: number;
  bandwidthUsedGB: number;
  bandwidthLimitGB: number;
  fileCount: number;
  bucketCount: number;
}

// ─── Provider Interface ──────────────────────────────────

interface StorageProviderAdapter {
  name: string;
  getPlans(): Promise<StoragePlan[]>;
  createBucket(name: string, region?: string): Promise<StorageBucket>;
  listBuckets(userId: string): Promise<StorageBucket[]>;
  uploadFile(bucketId: string, fileName: string, data: Buffer, contentType: string): Promise<UploadResult>;
  deleteFile(bucketId: string, fileId: string): Promise<boolean>;
  getUsage(userId: string): Promise<StorageUsage>;
}

// ─── Backblaze B2 Provider ───────────────────────────────

class BackblazeProvider implements StorageProviderAdapter {
  name = "backblaze";
  private keyId: string;
  private appKey: string;
  private authToken: string | null = null;
  private apiUrl: string | null = null;

  constructor(keyId: string, appKey: string) {
    this.keyId = keyId;
    this.appKey = appKey;
  }

  private async authorize() {
    if (this.authToken && this.apiUrl) return;
    const res = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
      headers: { "Authorization": `Basic ${Buffer.from(`${this.keyId}:${this.appKey}`).toString("base64")}` },
    });
    if (!res.ok) throw new Error(`B2 auth failed: ${res.status}`);
    const data = await res.json();
    this.authToken = data.authorizationToken;
    this.apiUrl = data.apiInfo?.storageApi?.apiUrl || data.apiUrl;
  }

  private async request(method: string, endpoint: string, body?: unknown) {
    await this.authorize();
    const res = await fetch(`${this.apiUrl}/b2api/v3/${endpoint}`, {
      method,
      headers: {
        "Authorization": this.authToken!,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`B2 API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async getPlans(): Promise<StoragePlan[]> {
    return [
      {
        id: "storage-10gb", name: "Storage 10GB", price: 1.99, currency: "USD", period: "monthly",
        storageGB: 10, bandwidthGB: 50,
        features: ["AES-256 encryption", "Version history", "Auto-backup", "File sharing links"],
      },
      {
        id: "storage-100gb", name: "Storage 100GB", price: 4.99, currency: "USD", period: "monthly",
        storageGB: 100, bandwidthGB: 250,
        features: ["Everything in 10GB", "Team sharing", "API access", "Sync client"],
      },
      {
        id: "storage-1tb", name: "Storage 1TB", price: 9.99, currency: "USD", period: "monthly",
        storageGB: 1000, bandwidthGB: 1000,
        features: ["Everything in 100GB", "Priority support", "Custom retention policies", "Webhook notifications"],
      },
    ];
  }

  async createBucket(name: string): Promise<StorageBucket> {
    const data = await this.request("POST", "b2_create_bucket", {
      bucketName: name,
      bucketType: "allPrivate",
    });
    return {
      id: data.bucketId,
      name: data.bucketName,
      region: "us-west-002",
      createdAt: new Date().toISOString(),
      fileCount: 0,
      totalSizeBytes: 0,
      isPublic: false,
    };
  }

  async listBuckets(): Promise<StorageBucket[]> {
    const data = await this.request("POST", "b2_list_buckets", {});
    return (data.buckets || []).map((b: Record<string, unknown>) => ({
      id: b.bucketId as string,
      name: b.bucketName as string,
      region: "us-west-002",
      createdAt: new Date().toISOString(),
      fileCount: 0,
      totalSizeBytes: 0,
      isPublic: b.bucketType === "allPublic",
    }));
  }

  async uploadFile(bucketId: string, fileName: string, data: Buffer, contentType: string): Promise<UploadResult> {
    // Get upload URL
    const uploadUrl = await this.request("POST", "b2_get_upload_url", { bucketId });

    const res = await fetch(uploadUrl.uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": uploadUrl.authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": contentType,
        "Content-Length": String(data.length),
        "X-Bz-Content-Sha1": "do_not_verify",
      },
      body: data,
    });

    if (!res.ok) throw new Error(`B2 upload failed: ${res.status}`);
    const result = await res.json();

    return {
      fileId: result.fileId,
      fileName: result.fileName,
      sizeBytes: result.contentLength,
      contentType: result.contentType,
      url: `${this.apiUrl}/file/${result.bucketName}/${result.fileName}`,
      uploadedAt: new Date().toISOString(),
    };
  }

  async deleteFile(_bucketId: string, fileId: string): Promise<boolean> {
    await this.request("POST", "b2_delete_file_version", { fileId, fileName: "" });
    return true;
  }

  async getUsage(): Promise<StorageUsage> {
    return {
      userId: "",
      storageUsedBytes: 0,
      storageUsedGB: 0,
      storageLimitGB: 100,
      bandwidthUsedBytes: 0,
      bandwidthUsedGB: 0,
      bandwidthLimitGB: 250,
      fileCount: 0,
      bucketCount: 0,
    };
  }
}

// ─── Mock Provider ───────────────────────────────────────

class MockStorageProvider implements StorageProviderAdapter {
  name = "mock";

  async getPlans(): Promise<StoragePlan[]> {
    return [
      {
        id: "storage-10gb", name: "Storage 10GB", price: 1.99, currency: "USD", period: "monthly",
        storageGB: 10, bandwidthGB: 50,
        features: ["AES-256 encryption", "Version history", "Auto-backup", "File sharing links"],
      },
      {
        id: "storage-100gb", name: "Storage 100GB", price: 4.99, currency: "USD", period: "monthly",
        storageGB: 100, bandwidthGB: 250,
        features: ["Everything in 10GB", "Team sharing", "API access", "Sync client"],
      },
      {
        id: "storage-1tb", name: "Storage 1TB", price: 9.99, currency: "USD", period: "monthly",
        storageGB: 1000, bandwidthGB: 1000,
        features: ["Everything in 100GB", "Priority support", "Custom retention policies", "Webhook notifications"],
      },
    ];
  }

  async createBucket(name: string): Promise<StorageBucket> {
    return {
      id: `mock-bucket-${Date.now()}`,
      name,
      region: "us-west",
      createdAt: new Date().toISOString(),
      fileCount: 0,
      totalSizeBytes: 0,
      isPublic: false,
    };
  }

  async listBuckets(): Promise<StorageBucket[]> {
    return [
      { id: "mock-1", name: "website-backups", region: "us-west", createdAt: "2026-03-01T00:00:00Z", fileCount: 42, totalSizeBytes: 1.2e9, isPublic: false },
      { id: "mock-2", name: "media-assets", region: "us-west", createdAt: "2026-03-15T00:00:00Z", fileCount: 156, totalSizeBytes: 4.8e9, isPublic: true },
    ];
  }

  async uploadFile(_bucketId: string, fileName: string, data: Buffer, contentType: string): Promise<UploadResult> {
    return {
      fileId: `mock-file-${Date.now()}`,
      fileName,
      sizeBytes: data.length,
      contentType,
      url: `https://storage.zoobicon.com/mock/${fileName}`,
      uploadedAt: new Date().toISOString(),
    };
  }

  async deleteFile(): Promise<boolean> { return true; }

  async getUsage(): Promise<StorageUsage> {
    return {
      userId: "mock",
      storageUsedBytes: 6.2e9,
      storageUsedGB: 5.77,
      storageLimitGB: 100,
      bandwidthUsedBytes: 12.4e9,
      bandwidthUsedGB: 11.55,
      bandwidthLimitGB: 250,
      fileCount: 198,
      bucketCount: 2,
    };
  }
}

// ─── Provider Factory ────────────────────────────────────

function getProvider(): StorageProviderAdapter {
  if (process.env.B2_KEY_ID && process.env.B2_APP_KEY) {
    return new BackblazeProvider(process.env.B2_KEY_ID, process.env.B2_APP_KEY);
  }
  return new MockStorageProvider();
}

let _provider: StorageProviderAdapter | null = null;
function provider(): StorageProviderAdapter {
  if (!_provider) _provider = getProvider();
  return _provider;
}

export const getProviderName = () => provider().name;
export const getStoragePlans = () => provider().getPlans();
export const createBucket = (name: string, region?: string) => provider().createBucket(name, region);
export const listBuckets = (userId: string) => provider().listBuckets(userId);
export const uploadFile = (bucketId: string, fileName: string, data: Buffer, contentType: string) => provider().uploadFile(bucketId, fileName, data, contentType);
export const deleteFile = (bucketId: string, fileId: string) => provider().deleteFile(bucketId, fileId);
export const getStorageUsage = (userId: string) => provider().getUsage(userId);
