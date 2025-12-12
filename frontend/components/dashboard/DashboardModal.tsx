import React, { useState } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, LayoutDashboard, Settings as SettingsIcon, User } from 'lucide-react';
import UserStatsView from './UserStatsView';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DashboardModal({ isOpen, onClose }: DashboardModalProps) {
    const user = useStore(state => state.user);
    const [activeTab, setActiveTab] = useState<'overview'>('overview');

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                            <LayoutDashboard className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                                                Dashboard
                                            </Dialog.Title>
                                            <p className="text-sm text-zinc-400">
                                                Welcome back, {user?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex border-b border-zinc-800 mb-6">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={cn(
                                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                            activeTab === 'overview'
                                                ? "border-indigo-500 text-indigo-400"
                                                : "border-transparent text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        <User className="w-4 h-4" />
                                        My Overview
                                    </button>
                                </div>

                                <div className="min-h-[400px]">
                                    <UserStatsView />
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
