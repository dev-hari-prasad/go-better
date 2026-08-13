import React, { useState } from 'react';
import {
  SparklesIcon,
  BellIcon,
  CheckIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { UserSettings } from '../../types/codeReview';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const presetRules = [
    { title: 'Security & OWASP', prompt: 'Flag any raw string comparisons on security tokens. Enforce constant-time timingSafeEqual.' },
    { title: 'Performance & N+1', prompt: 'Detect N+1 database queries in Prisma/ORM loops and suggest batching.' },
    { title: 'TypeScript Strict', prompt: 'Enforce strict null checks and reject "any" types without explicit justification.' },
  ];

  const applyPreset = (prompt: string) => {
    setForm((prev) => ({
      ...prev,
      customPromptRules: prev.customPromptRules ? `${prev.customPromptRules}\n\n${prompt}` : prompt,
    }));
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-5xl mx-auto animate-apple-fade select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232530] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Workspace Settings & Rules</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure custom code review standards, notification webhooks, and team access.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<CheckIcon className="w-4 h-4 text-black" />}
          onClick={handleSave}
        >
          {savedSuccess ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      {/* Review Sensitivity Threshold */}
      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-[#c0f200]" />
            <h2 className="text-sm font-bold text-zinc-100">Review Severity Threshold</h2>
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-4">
          <p className="text-xs text-zinc-400">Configure which issue severities trigger inline PR review comments.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'critical', label: 'Strict (Critical Only)', desc: 'Only post comments on high-risk security & breaking bugs.' },
              { id: 'warning', label: 'Balanced (Warnings + Critical)', desc: 'Post comments on security issues and potential runtime bugs.' },
              { id: 'suggestion', label: 'Comprehensive (All Items)', desc: 'Post comments on security, bugs, performance, and code style.' },
            ].map((thresh) => (
              <button
                key={thresh.id}
                onClick={() => setForm({ ...form, severityThreshold: thresh.id as any })}
                className={`p-4 text-left rounded-xl border text-xs transition-colors apple-button cursor-pointer ${
                  form.severityThreshold === thresh.id
                    ? 'bg-[#22242e] text-zinc-100 border-[#c0f200]/50 font-semibold'
                    : 'bg-[#0d1117] text-zinc-400 border-[#232530] hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-zinc-200">{thresh.label}</div>
                <div className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{thresh.desc}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Custom Review Rules */}
      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-[#c0f200]" />
            <h2 className="text-sm font-bold text-zinc-100">Custom Code Review Rules</h2>
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-4">
          <p className="text-xs text-zinc-400">
            Define custom guidelines for CodeRabbit to enforce across all pull requests in this workspace.
          </p>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Quick Presets:</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {presetRules.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset.prompt)}
                  className="px-3 py-1.5 bg-[#0d1117] hover:bg-[#22242e] border border-[#232530] rounded-lg text-xs text-zinc-300 transition-colors apple-button cursor-pointer"
                >
                  + {preset.title}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={6}
            value={form.customPromptRules}
            onChange={(e) => setForm({ ...form, customPromptRules: e.target.value })}
            className="w-full bg-[#0d1117] border border-[#232530] rounded-xl p-4 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 leading-relaxed"
            placeholder="Enter custom guidelines..."
          />
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-[#c0f200]" />
            <h2 className="text-sm font-bold text-zinc-100">Notification Webhooks</h2>
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">Slack Webhook Integration</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Receive instant alerts on critical security findings in Slack.</p>
            </div>
            <button
              onClick={() => setForm({ ...form, notifyOnSlack: !form.notifyOnSlack })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                form.notifyOnSlack ? 'bg-indigo-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  form.notifyOnSlack ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {form.notifyOnSlack && (
            <input
              type="text"
              value={form.slackWebhookUrl}
              onChange={(e) => setForm({ ...form, slackWebhookUrl: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-[#0d1117] border border-[#232530] rounded-lg px-4 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
            />
          )}
        </CardBody>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-[#c0f200]" />
            <h2 className="text-sm font-bold text-zinc-100">Team Members & Access</h2>
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-3">
          <div className="flex items-center justify-between p-4 bg-[#0d1117] border border-[#232530] rounded-xl text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                AM
              </div>
              <div>
                <span className="font-semibold text-zinc-200">Alex Mercer</span>
                <p className="text-xs text-zinc-400 font-mono">alexmercer@acme.io</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
              Workspace Admin
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
