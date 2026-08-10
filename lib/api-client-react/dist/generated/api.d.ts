import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ApiError, AuthUserEnvelope, BeginBrowserLoginParams, Business, BusinessEnvelope, BusinessInput, BusinessListResponse, CommunityPost, CommunityPostInput, ErrorEnvelope, Event, EventRsvpInput, HandleBrowserLoginCallbackParams, HealthStatus, ListBusinessesParams, ListCommunityPostsParams, ListEventsParams, ListReviewsParams, ListSurveysParams, LogoutSuccess, MobileTokenExchangeRequest, MobileTokenExchangeSuccess, OpenaiConversation, OpenaiConversationInput, OpenaiConversationWithMessages, OpenaiError, OpenaiImageInput, OpenaiImageOutput, OpenaiMessage, OpenaiMessageInput, Review, ReviewInput, ReviewsEnvelope, SavePlaceInput, SavedPlacesResponse, Survey, SurveyInput, TravelRecommendationRequest, TravelRecommendations, UserProfile, UserProfileUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCurrentAuthUserUrl: () => string;
/**
 * @summary Get the currently authenticated user
 */
export declare const getCurrentAuthUser: (options?: RequestInit) => Promise<AuthUserEnvelope>;
export declare const getGetCurrentAuthUserQueryKey: () => readonly ["/api/auth/user"];
export declare const getGetCurrentAuthUserQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentAuthUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentAuthUserQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentAuthUser>>>;
export type GetCurrentAuthUserQueryError = ErrorType<unknown>;
/**
 * @summary Get the currently authenticated user
 */
export declare function useGetCurrentAuthUser<TData = Awaited<ReturnType<typeof getCurrentAuthUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getBeginBrowserLoginUrl: (params?: BeginBrowserLoginParams) => string;
/**
 * @summary Start the browser OIDC login flow
 */
export declare const beginBrowserLogin: (params?: BeginBrowserLoginParams, options?: RequestInit) => Promise<unknown>;
export declare const getBeginBrowserLoginQueryKey: (params?: BeginBrowserLoginParams) => readonly ["/api/login", ...BeginBrowserLoginParams[]];
export declare const getBeginBrowserLoginQueryOptions: <TData = Awaited<ReturnType<typeof beginBrowserLogin>>, TError = ErrorType<void>>(params?: BeginBrowserLoginParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof beginBrowserLogin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof beginBrowserLogin>>, TError, TData> & {
    queryKey: QueryKey;
};
export type BeginBrowserLoginQueryResult = NonNullable<Awaited<ReturnType<typeof beginBrowserLogin>>>;
export type BeginBrowserLoginQueryError = ErrorType<void>;
/**
 * @summary Start the browser OIDC login flow
 */
export declare function useBeginBrowserLogin<TData = Awaited<ReturnType<typeof beginBrowserLogin>>, TError = ErrorType<void>>(params?: BeginBrowserLoginParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof beginBrowserLogin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getHandleBrowserLoginCallbackUrl: (params?: HandleBrowserLoginCallbackParams) => string;
/**
 * @summary Complete the browser OIDC login flow
 */
export declare const handleBrowserLoginCallback: (params?: HandleBrowserLoginCallbackParams, options?: RequestInit) => Promise<unknown>;
export declare const getHandleBrowserLoginCallbackQueryKey: (params?: HandleBrowserLoginCallbackParams) => readonly ["/api/callback", ...HandleBrowserLoginCallbackParams[]];
export declare const getHandleBrowserLoginCallbackQueryOptions: <TData = Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError = ErrorType<void>>(params?: HandleBrowserLoginCallbackParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HandleBrowserLoginCallbackQueryResult = NonNullable<Awaited<ReturnType<typeof handleBrowserLoginCallback>>>;
export type HandleBrowserLoginCallbackQueryError = ErrorType<void>;
/**
 * @summary Complete the browser OIDC login flow
 */
export declare function useHandleBrowserLoginCallback<TData = Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError = ErrorType<void>>(params?: HandleBrowserLoginCallbackParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getLogoutBrowserSessionUrl: () => string;
/**
 * @summary Clear the session and begin OIDC logout
 */
export declare const logoutBrowserSession: (options?: RequestInit) => Promise<unknown>;
export declare const getLogoutBrowserSessionQueryKey: () => readonly ["/api/logout"];
export declare const getLogoutBrowserSessionQueryOptions: <TData = Awaited<ReturnType<typeof logoutBrowserSession>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof logoutBrowserSession>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof logoutBrowserSession>>, TError, TData> & {
    queryKey: QueryKey;
};
export type LogoutBrowserSessionQueryResult = NonNullable<Awaited<ReturnType<typeof logoutBrowserSession>>>;
export type LogoutBrowserSessionQueryError = ErrorType<void>;
/**
 * @summary Clear the session and begin OIDC logout
 */
export declare function useLogoutBrowserSession<TData = Awaited<ReturnType<typeof logoutBrowserSession>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof logoutBrowserSession>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getExchangeMobileAuthorizationCodeUrl: () => string;
/**
 * @summary Exchange a mobile OIDC code for a session token
 */
export declare const exchangeMobileAuthorizationCode: (mobileTokenExchangeRequest: MobileTokenExchangeRequest, options?: RequestInit) => Promise<MobileTokenExchangeSuccess>;
export declare const getExchangeMobileAuthorizationCodeMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
        data: BodyType<MobileTokenExchangeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
    data: BodyType<MobileTokenExchangeRequest>;
}, TContext>;
export type ExchangeMobileAuthorizationCodeMutationResult = NonNullable<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>>;
export type ExchangeMobileAuthorizationCodeMutationBody = BodyType<MobileTokenExchangeRequest>;
export type ExchangeMobileAuthorizationCodeMutationError = ErrorType<ErrorEnvelope>;
/**
* @summary Exchange a mobile OIDC code for a session token
*/
export declare const useExchangeMobileAuthorizationCode: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
        data: BodyType<MobileTokenExchangeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
    data: BodyType<MobileTokenExchangeRequest>;
}, TContext>;
export declare const getLogoutMobileSessionUrl: () => string;
/**
 * @summary Delete a mobile session token
 */
export declare const logoutMobileSession: (options?: RequestInit) => Promise<LogoutSuccess>;
export declare const getLogoutMobileSessionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
export type LogoutMobileSessionMutationResult = NonNullable<Awaited<ReturnType<typeof logoutMobileSession>>>;
export type LogoutMobileSessionMutationError = ErrorType<unknown>;
/**
* @summary Delete a mobile session token
*/
export declare const useLogoutMobileSession: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
export declare const getListBusinessesUrl: (params?: ListBusinessesParams) => string;
/**
 * @summary List and search Black-owned businesses
 */
export declare const listBusinesses: (params?: ListBusinessesParams, options?: RequestInit) => Promise<BusinessListResponse>;
export declare const getListBusinessesQueryKey: (params?: ListBusinessesParams) => readonly ["/api/businesses", ...ListBusinessesParams[]];
export declare const getListBusinessesQueryOptions: <TData = Awaited<ReturnType<typeof listBusinesses>>, TError = ErrorType<unknown>>(params?: ListBusinessesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBusinesses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBusinesses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBusinessesQueryResult = NonNullable<Awaited<ReturnType<typeof listBusinesses>>>;
export type ListBusinessesQueryError = ErrorType<unknown>;
/**
 * @summary List and search Black-owned businesses
 */
export declare function useListBusinesses<TData = Awaited<ReturnType<typeof listBusinesses>>, TError = ErrorType<unknown>>(params?: ListBusinessesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBusinesses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSubmitBusinessUrl: () => string;
/**
 * @summary Submit a new Black-owned business
 */
export declare const submitBusiness: (businessInput: BusinessInput, options?: RequestInit) => Promise<Business>;
export declare const getSubmitBusinessMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitBusiness>>, TError, {
        data: BodyType<BusinessInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitBusiness>>, TError, {
    data: BodyType<BusinessInput>;
}, TContext>;
export type SubmitBusinessMutationResult = NonNullable<Awaited<ReturnType<typeof submitBusiness>>>;
export type SubmitBusinessMutationBody = BodyType<BusinessInput>;
export type SubmitBusinessMutationError = ErrorType<unknown>;
/**
* @summary Submit a new Black-owned business
*/
export declare const useSubmitBusiness: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitBusiness>>, TError, {
        data: BodyType<BusinessInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitBusiness>>, TError, {
    data: BodyType<BusinessInput>;
}, TContext>;
export declare const getGetBusinessUrl: (id: string) => string;
/**
 * @summary Get a single business by ID
 */
export declare const getBusiness: (id: string, options?: RequestInit) => Promise<BusinessEnvelope>;
export declare const getGetBusinessQueryKey: (id: string) => readonly [`/api/businesses/${string}`];
export declare const getGetBusinessQueryOptions: <TData = Awaited<ReturnType<typeof getBusiness>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusiness>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBusiness>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusinessQueryResult = NonNullable<Awaited<ReturnType<typeof getBusiness>>>;
export type GetBusinessQueryError = ErrorType<void>;
/**
 * @summary Get a single business by ID
 */
export declare function useGetBusiness<TData = Awaited<ReturnType<typeof getBusiness>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusiness>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListReviewsUrl: (params: ListReviewsParams) => string;
/**
 * @summary List reviews for a business
 */
export declare const listReviews: (params: ListReviewsParams, options?: RequestInit) => Promise<ReviewsEnvelope>;
export declare const getListReviewsQueryKey: (params?: ListReviewsParams) => readonly ["/api/reviews", ...ListReviewsParams[]];
export declare const getListReviewsQueryOptions: <TData = Awaited<ReturnType<typeof listReviews>>, TError = ErrorType<unknown>>(params: ListReviewsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listReviews>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListReviewsQueryResult = NonNullable<Awaited<ReturnType<typeof listReviews>>>;
export type ListReviewsQueryError = ErrorType<unknown>;
/**
 * @summary List reviews for a business
 */
export declare function useListReviews<TData = Awaited<ReturnType<typeof listReviews>>, TError = ErrorType<unknown>>(params: ListReviewsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateReviewUrl: () => string;
/**
 * @summary Create a review for a business
 */
export declare const createReview: (reviewInput: ReviewInput, options?: RequestInit) => Promise<Review>;
export declare const getCreateReviewMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError, {
        data: BodyType<ReviewInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError, {
    data: BodyType<ReviewInput>;
}, TContext>;
export type CreateReviewMutationResult = NonNullable<Awaited<ReturnType<typeof createReview>>>;
export type CreateReviewMutationBody = BodyType<ReviewInput>;
export type CreateReviewMutationError = ErrorType<unknown>;
/**
* @summary Create a review for a business
*/
export declare const useCreateReview: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError, {
        data: BodyType<ReviewInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createReview>>, TError, {
    data: BodyType<ReviewInput>;
}, TContext>;
export declare const getListSavedPlacesUrl: () => string;
/**
 * @summary Get the current user's saved businesses
 */
export declare const listSavedPlaces: (options?: RequestInit) => Promise<SavedPlacesResponse>;
export declare const getListSavedPlacesQueryKey: () => readonly ["/api/saved-places"];
export declare const getListSavedPlacesQueryOptions: <TData = Awaited<ReturnType<typeof listSavedPlaces>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSavedPlaces>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSavedPlaces>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSavedPlacesQueryResult = NonNullable<Awaited<ReturnType<typeof listSavedPlaces>>>;
export type ListSavedPlacesQueryError = ErrorType<unknown>;
/**
 * @summary Get the current user's saved businesses
 */
export declare function useListSavedPlaces<TData = Awaited<ReturnType<typeof listSavedPlaces>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSavedPlaces>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSavePlaceUrl: () => string;
/**
 * @summary Save a business to favorites
 */
export declare const savePlace: (savePlaceInput: SavePlaceInput, options?: RequestInit) => Promise<void>;
export declare const getSavePlaceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof savePlace>>, TError, {
        data: BodyType<SavePlaceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof savePlace>>, TError, {
    data: BodyType<SavePlaceInput>;
}, TContext>;
export type SavePlaceMutationResult = NonNullable<Awaited<ReturnType<typeof savePlace>>>;
export type SavePlaceMutationBody = BodyType<SavePlaceInput>;
export type SavePlaceMutationError = ErrorType<unknown>;
/**
* @summary Save a business to favorites
*/
export declare const useSavePlace: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof savePlace>>, TError, {
        data: BodyType<SavePlaceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof savePlace>>, TError, {
    data: BodyType<SavePlaceInput>;
}, TContext>;
export declare const getUnsavePlaceUrl: (businessId: string) => string;
/**
 * @summary Remove a business from favorites
 */
export declare const unsavePlace: (businessId: string, options?: RequestInit) => Promise<void>;
export declare const getUnsavePlaceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof unsavePlace>>, TError, {
        businessId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof unsavePlace>>, TError, {
    businessId: string;
}, TContext>;
export type UnsavePlaceMutationResult = NonNullable<Awaited<ReturnType<typeof unsavePlace>>>;
export type UnsavePlaceMutationError = ErrorType<unknown>;
/**
* @summary Remove a business from favorites
*/
export declare const useUnsavePlace: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof unsavePlace>>, TError, {
        businessId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof unsavePlace>>, TError, {
    businessId: string;
}, TContext>;
export declare const getListSurveysUrl: (params?: ListSurveysParams) => string;
/**
 * @summary List neighborhood safety surveys
 */
export declare const listSurveys: (params?: ListSurveysParams, options?: RequestInit) => Promise<Survey[]>;
export declare const getListSurveysQueryKey: (params?: ListSurveysParams) => readonly ["/api/surveys", ...ListSurveysParams[]];
export declare const getListSurveysQueryOptions: <TData = Awaited<ReturnType<typeof listSurveys>>, TError = ErrorType<unknown>>(params?: ListSurveysParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSurveys>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSurveys>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSurveysQueryResult = NonNullable<Awaited<ReturnType<typeof listSurveys>>>;
export type ListSurveysQueryError = ErrorType<unknown>;
/**
 * @summary List neighborhood safety surveys
 */
export declare function useListSurveys<TData = Awaited<ReturnType<typeof listSurveys>>, TError = ErrorType<unknown>>(params?: ListSurveysParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSurveys>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateSurveyUrl: () => string;
/**
 * @summary Submit a neighborhood safety survey
 */
export declare const createSurvey: (surveyInput: SurveyInput, options?: RequestInit) => Promise<Survey>;
export declare const getCreateSurveyMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSurvey>>, TError, {
        data: BodyType<SurveyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSurvey>>, TError, {
    data: BodyType<SurveyInput>;
}, TContext>;
export type CreateSurveyMutationResult = NonNullable<Awaited<ReturnType<typeof createSurvey>>>;
export type CreateSurveyMutationBody = BodyType<SurveyInput>;
export type CreateSurveyMutationError = ErrorType<unknown>;
/**
* @summary Submit a neighborhood safety survey
*/
export declare const useCreateSurvey: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSurvey>>, TError, {
        data: BodyType<SurveyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSurvey>>, TError, {
    data: BodyType<SurveyInput>;
}, TContext>;
export declare const getGetMyProfileUrl: () => string;
/**
 * @summary Get current user profile
 */
export declare const getMyProfile: (options?: RequestInit) => Promise<UserProfile>;
export declare const getGetMyProfileQueryKey: () => readonly ["/api/users/me"];
export declare const getGetMyProfileQueryOptions: <TData = Awaited<ReturnType<typeof getMyProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getMyProfile>>>;
export type GetMyProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get current user profile
 */
export declare function useGetMyProfile<TData = Awaited<ReturnType<typeof getMyProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateMyProfileUrl: () => string;
/**
 * @summary Update current user profile
 */
export declare const updateMyProfile: (userProfileUpdate: UserProfileUpdate, options?: RequestInit) => Promise<UserProfile>;
export declare const getUpdateMyProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyProfile>>, TError, {
        data: BodyType<UserProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMyProfile>>, TError, {
    data: BodyType<UserProfileUpdate>;
}, TContext>;
export type UpdateMyProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateMyProfile>>>;
export type UpdateMyProfileMutationBody = BodyType<UserProfileUpdate>;
export type UpdateMyProfileMutationError = ErrorType<unknown>;
/**
* @summary Update current user profile
*/
export declare const useUpdateMyProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyProfile>>, TError, {
        data: BodyType<UserProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMyProfile>>, TError, {
    data: BodyType<UserProfileUpdate>;
}, TContext>;
export declare const getListCommunityPostsUrl: (params?: ListCommunityPostsParams) => string;
/**
 * @summary List community feed posts
 */
export declare const listCommunityPosts: (params?: ListCommunityPostsParams, options?: RequestInit) => Promise<CommunityPost[]>;
export declare const getListCommunityPostsQueryKey: (params?: ListCommunityPostsParams) => readonly ["/api/community/posts", ...ListCommunityPostsParams[]];
export declare const getListCommunityPostsQueryOptions: <TData = Awaited<ReturnType<typeof listCommunityPosts>>, TError = ErrorType<unknown>>(params?: ListCommunityPostsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCommunityPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCommunityPosts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCommunityPostsQueryResult = NonNullable<Awaited<ReturnType<typeof listCommunityPosts>>>;
export type ListCommunityPostsQueryError = ErrorType<unknown>;
/**
 * @summary List community feed posts
 */
export declare function useListCommunityPosts<TData = Awaited<ReturnType<typeof listCommunityPosts>>, TError = ErrorType<unknown>>(params?: ListCommunityPostsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCommunityPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateCommunityPostUrl: () => string;
/**
 * @summary Create a community post
 */
export declare const createCommunityPost: (communityPostInput: CommunityPostInput, options?: RequestInit) => Promise<CommunityPost>;
export declare const getCreateCommunityPostMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCommunityPost>>, TError, {
        data: BodyType<CommunityPostInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCommunityPost>>, TError, {
    data: BodyType<CommunityPostInput>;
}, TContext>;
export type CreateCommunityPostMutationResult = NonNullable<Awaited<ReturnType<typeof createCommunityPost>>>;
export type CreateCommunityPostMutationBody = BodyType<CommunityPostInput>;
export type CreateCommunityPostMutationError = ErrorType<unknown>;
/**
* @summary Create a community post
*/
export declare const useCreateCommunityPost: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCommunityPost>>, TError, {
        data: BodyType<CommunityPostInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCommunityPost>>, TError, {
    data: BodyType<CommunityPostInput>;
}, TContext>;
export declare const getListEventsUrl: (params?: ListEventsParams) => string;
/**
 * @summary List community events
 */
export declare const listEvents: (params?: ListEventsParams, options?: RequestInit) => Promise<Event[]>;
export declare const getListEventsQueryKey: (params?: ListEventsParams) => readonly ["/api/events", ...ListEventsParams[]];
export declare const getListEventsQueryOptions: <TData = Awaited<ReturnType<typeof listEvents>>, TError = ErrorType<unknown>>(params?: ListEventsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEventsQueryResult = NonNullable<Awaited<ReturnType<typeof listEvents>>>;
export type ListEventsQueryError = ErrorType<unknown>;
/**
 * @summary List community events
 */
export declare function useListEvents<TData = Awaited<ReturnType<typeof listEvents>>, TError = ErrorType<unknown>>(params?: ListEventsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetEventUrl: (id: string) => string;
/**
 * @summary Get a single event
 */
export declare const getEvent: (id: string, options?: RequestInit) => Promise<Event>;
export declare const getGetEventQueryKey: (id: string) => readonly [`/api/events/${string}`];
export declare const getGetEventQueryOptions: <TData = Awaited<ReturnType<typeof getEvent>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEvent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEvent>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEventQueryResult = NonNullable<Awaited<ReturnType<typeof getEvent>>>;
export type GetEventQueryError = ErrorType<unknown>;
/**
 * @summary Get a single event
 */
export declare function useGetEvent<TData = Awaited<ReturnType<typeof getEvent>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEvent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRsvpEventUrl: () => string;
/**
 * @summary RSVP to an event
 */
export declare const rsvpEvent: (eventRsvpInput: EventRsvpInput, options?: RequestInit) => Promise<void>;
export declare const getRsvpEventMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rsvpEvent>>, TError, {
        data: BodyType<EventRsvpInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rsvpEvent>>, TError, {
    data: BodyType<EventRsvpInput>;
}, TContext>;
export type RsvpEventMutationResult = NonNullable<Awaited<ReturnType<typeof rsvpEvent>>>;
export type RsvpEventMutationBody = BodyType<EventRsvpInput>;
export type RsvpEventMutationError = ErrorType<unknown>;
/**
* @summary RSVP to an event
*/
export declare const useRsvpEvent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rsvpEvent>>, TError, {
        data: BodyType<EventRsvpInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rsvpEvent>>, TError, {
    data: BodyType<EventRsvpInput>;
}, TContext>;
export declare const getGetTravelRecommendationsUrl: () => string;
/**
 * @summary Get AI travel recommendations for a destination
 */
export declare const getTravelRecommendations: (travelRecommendationRequest: TravelRecommendationRequest, options?: RequestInit) => Promise<TravelRecommendations>;
export declare const getGetTravelRecommendationsMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof getTravelRecommendations>>, TError, {
        data: BodyType<TravelRecommendationRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof getTravelRecommendations>>, TError, {
    data: BodyType<TravelRecommendationRequest>;
}, TContext>;
export type GetTravelRecommendationsMutationResult = NonNullable<Awaited<ReturnType<typeof getTravelRecommendations>>>;
export type GetTravelRecommendationsMutationBody = BodyType<TravelRecommendationRequest>;
export type GetTravelRecommendationsMutationError = ErrorType<ApiError>;
/**
* @summary Get AI travel recommendations for a destination
*/
export declare const useGetTravelRecommendations: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof getTravelRecommendations>>, TError, {
        data: BodyType<TravelRecommendationRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof getTravelRecommendations>>, TError, {
    data: BodyType<TravelRecommendationRequest>;
}, TContext>;
export declare const getListOpenaiConversationsUrl: () => string;
/**
 * @summary List all conversations
 */
export declare const listOpenaiConversations: (options?: RequestInit) => Promise<OpenaiConversation[]>;
export declare const getListOpenaiConversationsQueryKey: () => readonly ["/api/openai/conversations"];
export declare const getListOpenaiConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listOpenaiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOpenaiConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listOpenaiConversations>>>;
export type ListOpenaiConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List all conversations
 */
export declare function useListOpenaiConversations<TData = Awaited<ReturnType<typeof listOpenaiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateOpenaiConversationUrl: () => string;
/**
 * @summary Create a new conversation
 */
export declare const createOpenaiConversation: (openaiConversationInput: OpenaiConversationInput, options?: RequestInit) => Promise<OpenaiConversation>;
export declare const getCreateOpenaiConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
        data: BodyType<OpenaiConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
    data: BodyType<OpenaiConversationInput>;
}, TContext>;
export type CreateOpenaiConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createOpenaiConversation>>>;
export type CreateOpenaiConversationMutationBody = BodyType<OpenaiConversationInput>;
export type CreateOpenaiConversationMutationError = ErrorType<unknown>;
/**
* @summary Create a new conversation
*/
export declare const useCreateOpenaiConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
        data: BodyType<OpenaiConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
    data: BodyType<OpenaiConversationInput>;
}, TContext>;
export declare const getGetOpenaiConversationUrl: (id: number) => string;
/**
 * @summary Get conversation with messages
 */
export declare const getOpenaiConversation: (id: number, options?: RequestInit) => Promise<OpenaiConversationWithMessages>;
export declare const getGetOpenaiConversationQueryKey: (id: number) => readonly [`/api/openai/conversations/${number}`];
export declare const getGetOpenaiConversationQueryOptions: <TData = Awaited<ReturnType<typeof getOpenaiConversation>>, TError = ErrorType<OpenaiError>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpenaiConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOpenaiConversation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOpenaiConversationQueryResult = NonNullable<Awaited<ReturnType<typeof getOpenaiConversation>>>;
export type GetOpenaiConversationQueryError = ErrorType<OpenaiError>;
/**
 * @summary Get conversation with messages
 */
export declare function useGetOpenaiConversation<TData = Awaited<ReturnType<typeof getOpenaiConversation>>, TError = ErrorType<OpenaiError>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpenaiConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteOpenaiConversationUrl: (id: number) => string;
/**
 * @summary Delete a conversation
 */
export declare const deleteOpenaiConversation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteOpenaiConversationMutationOptions: <TError = ErrorType<OpenaiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteOpenaiConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteOpenaiConversation>>, TError, {
    id: number;
}, TContext>;
export type DeleteOpenaiConversationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteOpenaiConversation>>>;
export type DeleteOpenaiConversationMutationError = ErrorType<OpenaiError>;
/**
* @summary Delete a conversation
*/
export declare const useDeleteOpenaiConversation: <TError = ErrorType<OpenaiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteOpenaiConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteOpenaiConversation>>, TError, {
    id: number;
}, TContext>;
export declare const getListOpenaiMessagesUrl: (id: number) => string;
/**
 * @summary List messages in a conversation
 */
export declare const listOpenaiMessages: (id: number, options?: RequestInit) => Promise<OpenaiMessage[]>;
export declare const getListOpenaiMessagesQueryKey: (id: number) => readonly [`/api/openai/conversations/${number}/messages`];
export declare const getListOpenaiMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listOpenaiMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOpenaiMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOpenaiMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listOpenaiMessages>>>;
export type ListOpenaiMessagesQueryError = ErrorType<unknown>;
/**
 * @summary List messages in a conversation
 */
export declare function useListOpenaiMessages<TData = Awaited<ReturnType<typeof listOpenaiMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendOpenaiMessageUrl: (id: number) => string;
/**
 * @summary Send a text message and receive a streaming text response
 */
export declare const sendOpenaiMessage: (id: number, openaiMessageInput: OpenaiMessageInput, options?: RequestInit) => Promise<unknown>;
export declare const getSendOpenaiMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
        id: number;
        data: BodyType<OpenaiMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
    id: number;
    data: BodyType<OpenaiMessageInput>;
}, TContext>;
export type SendOpenaiMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendOpenaiMessage>>>;
export type SendOpenaiMessageMutationBody = BodyType<OpenaiMessageInput>;
export type SendOpenaiMessageMutationError = ErrorType<unknown>;
/**
* @summary Send a text message and receive a streaming text response
*/
export declare const useSendOpenaiMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
        id: number;
        data: BodyType<OpenaiMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
    id: number;
    data: BodyType<OpenaiMessageInput>;
}, TContext>;
export declare const getGenerateOpenaiImageUrl: () => string;
/**
 * @summary Generate an image from a text prompt
 */
export declare const generateOpenaiImage: (openaiImageInput: OpenaiImageInput, options?: RequestInit) => Promise<OpenaiImageOutput>;
export declare const getGenerateOpenaiImageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateOpenaiImage>>, TError, {
        data: BodyType<OpenaiImageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateOpenaiImage>>, TError, {
    data: BodyType<OpenaiImageInput>;
}, TContext>;
export type GenerateOpenaiImageMutationResult = NonNullable<Awaited<ReturnType<typeof generateOpenaiImage>>>;
export type GenerateOpenaiImageMutationBody = BodyType<OpenaiImageInput>;
export type GenerateOpenaiImageMutationError = ErrorType<unknown>;
/**
* @summary Generate an image from a text prompt
*/
export declare const useGenerateOpenaiImage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateOpenaiImage>>, TError, {
        data: BodyType<OpenaiImageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateOpenaiImage>>, TError, {
    data: BodyType<OpenaiImageInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map