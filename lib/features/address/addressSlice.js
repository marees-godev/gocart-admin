import { addressDummyData } from '@/assets/assets'
import { createSlice } from '@reduxjs/toolkit'

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [
            {
                ...addressDummyData,
                title: 'Home',
                isDefault: true,
            },
        ],
    },
    reducers: {
        addAddress: (state, action) => {
            const newAddress = {
                id: `addr_${Date.now()}`,
                createdAt: new Date().toISOString(),
                ...action.payload,
            }
            if (newAddress.isDefault) {
                state.list.forEach(addr => { addr.isDefault = false })
            }
            state.list.push(newAddress)
        },
        updateAddress: (state, action) => {
            const index = state.list.findIndex(item => item.id === action.payload.id)
            if (index !== -1) {
                if (action.payload.isDefault) {
                    state.list.forEach(addr => { addr.isDefault = false })
                }
                state.list[index] = { ...state.list[index], ...action.payload }
            }
        },
        deleteAddress: (state, action) => {
            state.list = state.list.filter(item => item.id !== action.payload)
        },
        setDefaultAddress: (state, action) => {
            state.list.forEach(addr => {
                addr.isDefault = (addr.id === action.payload)
            })
        }
    }
})

export const { addAddress, updateAddress, deleteAddress, setDefaultAddress } = addressSlice.actions

export default addressSlice.reducer