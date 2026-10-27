'use client'

import React, { useState } from 'react'
import {
    FolderTree,
    Plus,
    Trash2,
    Edit2,
    Package,
    Search,
    Check,
    X,
    Layers
} from 'lucide-react'
import { categories as defaultCategories } from '@/assets/assets'

export default function AdminCategories() {
    const [categoriesList, setCategoriesList] = useState(
        (defaultCategories || ['Headphones', 'Speakers', 'Watch', 'Earbuds', 'Mouse', 'Decoration']).map(
            (cat, idx) => ({
                id: idx + 1,
                name: cat,
                productsCount: Math.floor(Math.random() * 40) + 10,
                isActive: true,
                slug: cat.toLowerCase()
            })
        )
    )

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    const handleAddCategory = (e) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return
        const newCat = {
            id: Date.now(),
            name: newCategoryName.trim(),
            productsCount: 0,
            isActive: true,
            slug: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-')
        }
        setCategoriesList([newCat, ...categoriesList])
        setNewCategoryName('')
        setIsAddModalOpen(false)
    }

    const handleDelete = (id) => {
        setCategoriesList(categoriesList.filter((c) => c.id !== id))
    }

    return (
        <div className="text-slate-600 mb-28 max-w-5xl space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl text-slate-500">
                        Product <span className="text-slate-800 font-medium">Categories</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Organize the marketplace catalog structure, departments, and category filters.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium shadow-sm transition"
                >
                    <Plus size={17} /> Add New Category
                </button>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {categoriesList.map((cat) => (
                    <div
                        key={cat.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between hover:border-slate-300 transition"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                <Layers size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">{cat.name}</h3>
                                <p className="text-xs text-slate-400">{cat.productsCount} active products</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Category"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Category Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900">Add New Category</h3>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Smart Home, Fashion..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition"
                            >
                                Save Category
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
