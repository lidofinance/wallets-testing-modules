import axios, { AxiosInstance } from 'axios';

export interface GrafanaClientOptions {
  /** Base URL of Grafana, e.g. https://grafana.example.com */
  baseUrl: string;
  /** Grafana API key with permissions to create annotations */
  apiKey: string;
}

export interface GrafanaAnnotationPayload {
  /** Epoch milliseconds */
  time: number;
  /** Optional time end (range annotation) */
  timeEnd?: number;
  /** Tags for filtering/searching */
  tags?: string[];
  /** Markdown / text content */
  text: string;
  /** Optional dashboard id */
  dashboardId?: number;
  /** Optional panel id */
  panelId?: number;
}

export interface GrafanaAnnotationResponse {
  id: number;
  message?: string;
}

/** Minimal Grafana API client with only annotation creation */
export class GrafanaClient {
  private readonly http: AxiosInstance;

  constructor(private readonly options: GrafanaClientOptions) {
    this.http = axios.create({
      baseURL: options.baseUrl.replace(/\/$/, ''),
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    });
  }

  /**
   * Create annotation in Grafana.
   */
  async addAnnotation(
    payload: GrafanaAnnotationPayload,
  ): Promise<GrafanaAnnotationResponse> {
    const body: Record<string, any> = {
      time: payload.time,
      text: payload.text,
    };

    if (payload.timeEnd) body.timeEnd = payload.timeEnd;
    if (payload.tags?.length) body.tags = payload.tags;
    if (payload.dashboardId != null) body.dashboardId = payload.dashboardId;
    if (payload.panelId != null) body.panelId = payload.panelId;

    const { data } = await this.http.post<
      GrafanaAnnotationResponse | { id: number }
    >('/api/annotations', body);
    // Some Grafana versions just return {id}
    if ('id' in data) return data as GrafanaAnnotationResponse;
    return data;
  }
}
