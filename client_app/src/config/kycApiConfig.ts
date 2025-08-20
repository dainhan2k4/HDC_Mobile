import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_ENDPOINTS } from "./apiConfig";

const BaseUrl = "http://10.10.2.132:8000"

const KYC_API_CONFIG = {
    BASE_URL: BaseUrl,
    TIMEOUT: 15000,
    HEADERS: {
        "Content-Type": "multipart/form-data",
        "Accept": "application/json",
    },
}

export type KycUploadResult = {
    id: string;
    ocr?: Record<string, any>;
    detection?: any;
}

export type KycProcessByIdPayload = {
    front_id: string;
    back_id: string;
    detection_id: string;

}

export type KycProcessResult = {
    request_id: string;
    status?: "pending" | "approved" | "rejected";
    result?: Record<string, any>;
}

export type ApiResponse<T> = {
    success: boolean;
    data?: T,
    error?: string;
    rawResponse?: AxiosResponse;
}

export class KycApi {
    private static instance: KycApi;
    private axios: AxiosInstance;
    private sessionId: string | null = null;

    private constructor() {
        this.axios = axios.create({
            baseURL: KYC_API_CONFIG.BASE_URL,
            headers: KYC_API_CONFIG.HEADERS,
            timeout: KYC_API_CONFIG.TIMEOUT,
        });

        this.axios.interceptors.request.use((config) => {
            config.headers = {
                ...KYC_API_CONFIG.HEADERS,
                ...config.headers,
            } as any;

            if (this.sessionId) {
                config.headers["X-Session-Id"] = this.sessionId;
            }

            return config;
        })

    }

    static getInstance(): KycApi {
        if (!KycApi.instance) {
            KycApi.instance = new KycApi();
        }
        return KycApi.instance;
    }

    setSessionId(sessionId: string) {
        this.sessionId = sessionId;
    }

    private async request<T = any>(
        endpoint: string,
        config: AxiosRequestConfig ={}  
    ): Promise<ApiResponse<T>>{
        try {
            const res = await this.axios.request({ url: endpoint, ...config })
            const data = res.data;

            // KYC endpoints have different response format
            if (endpoint.includes('/api/ekyc/')) {
                if (data?.result) {
                    // For OCR endpoints, wrap result in expected format
                    return {
                        success: true, 
                        data: {
                            id: Date.now().toString(), // Generate temporary ID
                            ocr: data.result
                        }, 
                        rawResponse: res
                    };
                } else if (data?.error) {
                    return {success: false, error: data.error, rawResponse: res};
                }
            }

            // Standard middleware format
            if(data?.success){
                return {success: true, data: data.data, rawResponse: res};
            }else{
                return {success: false, error:data.error, rawResponse: res};
            }
        } catch (error : any) {
            return {success: false, error: error.message, rawResponse: error.response};
        }
    }

      /* -------------------- KYC APIs -------------------- */

      async healthCheck() {
        return this.request<void>(API_ENDPOINTS.KYC.HEALTH, {method: "GET"});
      } 

      async uploadFrontId(file : File | Blob) {
        const formData = new FormData();
        formData.append("frontID", file, "front_id.jpg");
        return this.request<KycUploadResult>(API_ENDPOINTS.KYC.FRONT_ID, {
            method:"POST",
            data: formData
        });
    }

      async uploadBackId(file : File | Blob) {
        const formData = new FormData();
        formData.append("backID", file, "back_id.jpg");
        return this.request<KycUploadResult>(API_ENDPOINTS.KYC.BACK_ID, {
            method:"POST",
            data: formData
        });
    }

      async uploadDetection(file: File | Blob, expected: string) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("expected", expected);

        return this.request<KycProcessResult>(API_ENDPOINTS.KYC.DETECTION, {
            method: "POST",
            data: formData,
        });
    }

        async processByFiles(frontId: string, backId: string, portraits: (File | Blob)[]) {
            const formData = new FormData();
            formData.append("front_id", frontId);
            formData.append("back_id", backId);
            portraits.forEach((p, idx) => {
                formData.append(`portraits[${idx}]`, p as File, `portraits-${idx}.jpg`);
            })

            return this.request<KycProcessResult>(API_ENDPOINTS.KYC.PROCESS, {
                method: "POST",
                data: formData,
            });
        }

        
}
export const kycApi = KycApi.getInstance();