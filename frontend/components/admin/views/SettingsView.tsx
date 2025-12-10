import React from 'react';
import { Settings, Bell, Shield, Database, Layout } from 'lucide-react';

export default function SettingsView() {
    return (
        <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border/50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="w-6 h-6 text-primary" />
                        System Settings
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Global configuration for the platform</p>
                </div>

                <div className="p-6 space-y-8">
                    <section>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-500" />
                            Security & Access
                        </h3>
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50">
                                <div>
                                    <h4 className="font-medium">Registration</h4>
                                    <p className="text-sm text-muted-foreground">Allow new users to sign up</p>
                                </div>
                                <div className="w-12 h-6 bg-green-500/20 rounded-full relative cursor-pointer">
                                    <div className="w-4 h-4 bg-green-500 rounded-full absolute right-1 top-1" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50">
                                <div>
                                    <h4 className="font-medium">Force 2FA</h4>
                                    <p className="text-sm text-muted-foreground">Require two-factor authentication for admins</p>
                                </div>
                                <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer">
                                    <div className="w-4 h-4 bg-zinc-400 rounded-full absolute left-1 top-1" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-500" />
                            Data Retention
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                <label className="block text-sm font-medium mb-2">Chat History Retention</label>
                                <select className="w-full bg-background border border-border rounded-lg px-3 py-2">
                                    <option>30 days</option>
                                    <option>90 days</option>
                                    <option>1 year</option>
                                    <option>Forever</option>
                                </select>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                <label className="block text-sm font-medium mb-2">Log Level</label>
                                <select className="w-full bg-background border border-border rounded-lg px-3 py-2">
                                    <option>Info</option>
                                    <option>Debug</option>
                                    <option>Error</option>
                                </select>
                            </div>
                        </div>
                    </section>
                </div>
                <div className="p-6 bg-muted/10 border-t border-border/50 flex justify-end">
                    <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/20 transition-all">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
