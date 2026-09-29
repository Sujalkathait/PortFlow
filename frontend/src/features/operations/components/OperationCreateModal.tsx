import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateOperationFormInput } from '../types/operation.types';

interface OperationCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: CreateOperationFormInput) => Promise<boolean>;
    submitting: boolean;
}

export function OperationCreateModal({
    isOpen,
    onClose,
    onSubmit,
    submitting,
}: OperationCreateModalProps) {
    const [formType, setFormType] = useState('Cargo Discharge');
    const [formShip, setFormShip] = useState('');
    const [formCrane, setFormCrane] = useState('Crane A');
    const [formBerth, setFormBerth] = useState('Berth 1');
    const [customCrane, setCustomCrane] = useState('');
    const [customBerth, setCustomBerth] = useState('');
    const [formPriority, setFormPriority] = useState('1');
    const [formBurst, setFormBurst] = useState('4');
    const [localError, setLocalError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (!formShip.trim()) {
            setLocalError('Ship name is required.');
            return;
        }

        const selectedBerth = formBerth === 'Custom' ? customBerth.trim() : formBerth;
        const selectedCrane = formCrane === 'Custom' ? customCrane.trim() : formCrane;

        if (!selectedBerth) {
            setLocalError('Please specify a Berth ID.');
            return;
        }

        const success = await onSubmit({
            operationType: formType,
            shipName: formShip.trim(),
            craneId: selectedCrane || 'None',
            berthId: selectedBerth,
            priority: Number(formPriority),
            burstDuration: Number(formBurst) * 1000,
        });

        if (success) {
            setFormShip('');
            setCustomCrane('');
            setCustomBerth('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Create New Operation</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {localError && (
                    <div className="mt-3 p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200 dark:bg-red-950/50 dark:text-red-300">
                        {localError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Operation Type</label>
                        <select
                            value={formType}
                            onChange={e => setFormType(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option>Cargo Discharge</option>
                            <option>Bulk Grain Unloading</option>
                            <option>Refrigerated Cargo Inspection</option>
                            <option>Hazmat Staging</option>
                            <option>Bunkering Fuel Transfer</option>
                            <option>Vehicle Dispatch</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Ship Name *</label>
                        <Input
                            value={formShip}
                            onChange={e => setFormShip(e.target.value)}
                            placeholder="e.g. Ever Given, Maersk Mc-Kinney"
                            required
                        />
                    </div>

                    {/* Dynamic Berth Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Berth Allocation</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={formBerth}
                                onChange={e => setFormBerth(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="Berth 1">Berth 1</option>
                                <option value="Berth 2">Berth 2</option>
                                <option value="Berth 3">Berth 3</option>
                                <option value="Berth 4">Berth 4</option>
                                <option value="Custom">Custom Berth...</option>
                            </select>
                            {formBerth === 'Custom' ? (
                                <Input
                                    value={customBerth}
                                    onChange={e => setCustomBerth(e.target.value)}
                                    placeholder="Enter Berth name/ID"
                                    required
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground flex items-center px-2 bg-muted/40 rounded border">
                                    Preset: {formBerth}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Crane Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Crane Allocation</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={formCrane}
                                onChange={e => setFormCrane(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="Crane A">Crane A</option>
                                <option value="Crane B">Crane B</option>
                                <option value="Crane C">Crane C</option>
                                <option value="None">None</option>
                                <option value="Custom">Custom Crane...</option>
                            </select>
                            {formCrane === 'Custom' ? (
                                <Input
                                    value={customCrane}
                                    onChange={e => setCustomCrane(e.target.value)}
                                    placeholder="Enter Crane ID/Name"
                                    required
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground flex items-center px-2 bg-muted/40 rounded border">
                                    Preset: {formCrane}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Priority</label>
                            <select
                                value={formPriority}
                                onChange={e => setFormPriority(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="1">1 — Normal</option>
                                <option value="2">2 — High</option>
                                <option value="3">3 — Critical</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Burst Duration (s)</label>
                            <Input
                                type="number"
                                min="1"
                                max="60"
                                value={formBurst}
                                onChange={e => setFormBurst(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit to Queue'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
