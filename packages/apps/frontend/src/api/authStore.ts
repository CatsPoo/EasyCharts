let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];


export function setAccessToken(token: string | null) {
accessToken = token;
}
export function getAccessToken() {
return accessToken;
}


export function setOnAuthFailure(cb: (() => void) | null) {
onAuthFailure = cb;
}


export function beginRefresh<T>(refreshCall: () => Promise<string>): Promise<string> {
if (!isRefreshing) {
isRefreshing = true;
return refreshCall()
.then((newToken) => {
pendingQueue.forEach((p) => p.resolve(newToken));
pendingQueue = [];
return newToken;
})
.catch((err) => {
pendingQueue.forEach((p) => p.reject(err));
pendingQueue = [];
onAuthFailure?.();
throw err;
})
.finally(() => {
isRefreshing = false;
});
}
// Already refreshing → queue the promise
return new Promise<string>((resolve, reject) => {
pendingQueue.push({ resolve, reject });
});
}