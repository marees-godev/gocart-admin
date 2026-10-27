import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth: (state, action) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.isAuthenticated = true
            state.loading = false
        },
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = null
            state.loading = null
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                localStorage.removeItem('adminKey')
                document.cookie = 'token=; Max-Age=0; path=/;'
                document.cookie = 'adminKey=; Max-Age=0; path=/;'
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        }
    }
})

export const { setAuth, logout, setLoading } = authSlice.actions
export default authSlice.reducer