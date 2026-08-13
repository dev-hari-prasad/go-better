import React from 'react';
import { ClockIcon, ShieldCheckIcon, SparklesIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { ActivityEvent } from '../../types/codeReview';
import { Card, CardHeader, CardBody } from '../ui/Card';

interface ActivityLogViewProps {
  activities: ActivityEvent[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activities }) => {
  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-3.25rem)] max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Audit & Activity Log</h1>
        <p className="text-xs text-zinc-400 mt-1">Real-time log of automated AI code reviews, webhook triggers, and developer resolution actions.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4 flex items-center justify-between font-mono">
            <div>
              <p className="text-xs text-zinc-400">Total Tokens Processed</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">1,482,910</h3>
            </div>
            <CpuChipIcon className="w-5 h-5 text-indigo-400" />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center justify-between font-mono">
            <div>
              <p className="text-xs text-zinc-400">Avg Response Latency</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">11.8s</h3>
            </div>
            <ClockIcon className="w-5 h-5 text-emerald-400" />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center justify-between font-mono">
            <div>
              <p className="text-xs text-zinc-400">Inline Suggestions Applied</p>
              <h3 className="text-xl font-bold text-indigo-400 mt-1">42</h3>
            </div>
            <ShieldCheckIcon className="w-5 h-5 text-indigo-400" />
          </CardBody>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Audit Stream Timeline</h2>
          </div>
        </CardHeader>
        <div className="divide-y divide-zinc-800/60 p-4">
          {activities.map((act) => (
            <div key={act.id} className="py-3 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{act.actor.name}</span>
                  <span className="font-mono text-[11px] text-zinc-500">@{act.actor.username}</span>
                  <span className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 rounded font-mono text-[10px] text-zinc-400">
                    {act.target}
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-500">{act.timestamp}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{act.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
