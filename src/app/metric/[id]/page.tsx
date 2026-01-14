'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, MessageSquare } from 'lucide-react';
import { getMetricDetail } from '@/lib/supabase/queries';
import { useAuth } from '@/components/providers/AuthProvider';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getCurrentWeekOf } from '@/lib/utils/formatting';

export default function MetricDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [metric, setMetric] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekOf());
  const [showNarrativeForm, setShowNarrativeForm] = useState(false);
  const [narrativeContent, setNarrativeContent] = useState('');
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [commitmentTitle, setCommitmentTitle] = useState('');
  const [commitmentDesc, setCommitmentDesc] = useState('');
  const [commitmentDate, setCommitmentDate] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState<string | null>(null);
  const [updateContent, setUpdateContent] = useState('');

  useEffect(() => {
    loadMetric();
  }, [params.id]);

  const loadMetric = async () => {
    setLoading(true);
    const data = await getMetricDetail(params.id as string);
    setMetric(data);
    setLoading(false);
  };

  const handleAddNarrative = async () => {
    if (!narrativeContent.trim() || !user?.id) return;
    try {
      const res = await fetch(`/api/metrics/${metric?.id}/narratives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executiveId: user.id, content: narrativeContent }),
      });
      if (res.ok) {
        setNarrativeContent('');
        setShowNarrativeForm(false);
        await loadMetric();
      }
    } catch (error) {
      console.error('Error adding narrative:', error);
    }
  };

  const handleDeleteNarrative = async (narrativeId: string) => {
    if (!confirm('Delete this narrative?')) return;
    try {
      const res = await fetch(`/api/metrics/${metric?.id}/narratives/${narrativeId}`, { method: 'DELETE' });
      if (res.ok) await loadMetric();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddCommitment = async () => {
    if (!commitmentTitle.trim() || !user?.id) return;
    try {
      const res = await fetch(`/api/metrics/${metric?.id}/commitments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executiveId: user.id,
          title: commitmentTitle,
          description: commitmentDesc,
          targetDate: commitmentDate,
        }),
      });
      if (res.ok) {
        setCommitmentTitle('');
        setCommitmentDesc('');
        setCommitmentDate('');
        setShowCommitmentForm(false);
        await loadMetric();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddUpdate = async (commitmentId: string) => {
    if (!updateContent.trim() || !user?.id) return;
    try {
      const res = await fetch(`/api/commitments/${commitmentId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executiveId: user.id, content: updateContent }),
      });
      if (res.ok) {
        setUpdateContent('');
        setShowUpdateForm(null);
        await loadMetric();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-[var(--gray-500)]">Loading...</div></div>;
  if (!metric) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-[var(--gray-500)]">Metric not found</p><Link href="/" className="text-[var(--primary)] mt-2 inline-block">Back to Dashboard</Link></div></div>;

  const percentageOfTarget = (metric.current_value / metric.target_value) * 100;

  return (
    <>
      <DashboardHeader
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        onRefresh={loadMetric}
        isRefreshing={loading}
      />
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--gray-600)] hover:text-[var(--gray-900)] mb-6">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--gray-900)]">{metric.name}</h1>
              <p className="text-sm text-[var(--gray-600)] mt-1">{metric.pillar?.name}</p>
            </div>
            <StatusBadge status={metric.status || 'neutral'} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-[var(--gray-600)]">Current</p>
              <p className="text-2xl font-bold">{metric.format === 'currency' && '$'}{metric.current_value?.toLocaleString()}{metric.format === 'percentage' && '%'}{metric.unit && ` ${metric.unit}`}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--gray-600)]">Target</p>
              <p className="text-2xl font-bold">{metric.format === 'currency' && '$'}{metric.target_value?.toLocaleString()}{metric.format === 'percentage' && '%'}{metric.unit && ` ${metric.unit}`}</p>
            </div>
          </div>
          <div className="w-full bg-[var(--gray-100)] rounded-full h-2 mb-4">
            <div className="bg-[var(--primary)] h-2 rounded-full" style={{ width: `${Math.min(percentageOfTarget, 100)}%` }} />
          </div>
          {metric.description && <p className="text-sm text-[var(--gray-600)] mt-4">{metric.description}</p>}
        </div>

        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Narratives</h2>
            {!showNarrativeForm && <button onClick={() => setShowNarrativeForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90"><Plus size={16} />Add Narrative</button>}
          </div>
          {showNarrativeForm && (
            <div className="bg-[var(--gray-50)] rounded-lg p-4 mb-4">
              <textarea value={narrativeContent} onChange={(e) => setNarrativeContent(e.target.value)} placeholder="Describe the current situation..." className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg min-h-[120px] resize-none focus:outline-none focus:border-[var(--primary)]" />
              <div className="flex gap-2 mt-3">
                <button onClick={handleAddNarrative} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90"><Save size={16} className="inline mr-1" />Save</button>
                <button onClick={() => { setShowNarrativeForm(false); setNarrativeContent(''); }} className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {metric.narratives?.length === 0 && !showNarrativeForm && <p className="text-sm text-[var(--gray-500)] text-center py-8">No narratives yet.</p>}
            {metric.narratives?.map((narrative: any) => (
              <div key={narrative.id} className="border border-[var(--gray-200)] rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{narrative.executive?.name}</div>
                    <div className="text-xs text-[var(--gray-500)]">{new Date(narrative.created_at).toLocaleDateString()}</div>
                  </div>
                  {user?.id === narrative.executive_id && <button onClick={() => handleDeleteNarrative(narrative.id)} className="p-1 text-[var(--gray-400)] hover:text-red-500"><Trash2 size={16} /></button>}
                </div>
                <p className="text-sm text-[var(--gray-700)] whitespace-pre-wrap">{narrative.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Action Plans</h2>
            {!showCommitmentForm && <button onClick={() => setShowCommitmentForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90"><Plus size={16} />Add Action Plan</button>}
          </div>
          {showCommitmentForm && (
            <div className="bg-[var(--gray-50)] rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <input type="text" value={commitmentTitle} onChange={(e) => setCommitmentTitle(e.target.value)} placeholder="Action plan title" className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]" />
                <textarea value={commitmentDesc} onChange={(e) => setCommitmentDesc(e.target.value)} placeholder="Description" className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg min-h-[80px] resize-none focus:outline-none focus:border-[var(--primary)]" />
                <input type="date" value={commitmentDate} onChange={(e) => setCommitmentDate(e.target.value)} className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleAddCommitment} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90"><Save size={16} className="inline mr-1" />Save</button>
                <button onClick={() => { setShowCommitmentForm(false); setCommitmentTitle(''); setCommitmentDesc(''); setCommitmentDate(''); }} className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {metric.commitments?.length === 0 && !showCommitmentForm && <p className="text-sm text-[var(--gray-500)] text-center py-8">No action plans yet.</p>}
            {metric.commitments?.map((commitment: any) => (
              <div key={commitment.id} className="border border-[var(--gray-200)] rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{commitment.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--gray-600)]">{commitment.executive?.name}</span>
                      {commitment.target_date && <span className="text-xs text-[var(--gray-500)]">Due: {new Date(commitment.target_date).toLocaleDateString()}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded ${commitment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{commitment.status}</span>
                    </div>
                  </div>
                </div>
                {commitment.description && <p className="text-sm text-[var(--gray-700)] mb-3">{commitment.description}</p>}
                {commitment.updates?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--gray-100)] space-y-2">
                    {commitment.updates.map((update: any) => (
                      <div key={update.id} className="flex items-start gap-2">
                        <MessageSquare size={14} className="text-[var(--gray-400)] mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-[var(--gray-600)]">{update.content}</p>
                          <p className="text-xs text-[var(--gray-400)] mt-1">{update.executive?.name} - {new Date(update.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showUpdateForm === commitment.id ? (
                  <div className="mt-3 pt-3 border-t border-[var(--gray-100)]">
                    <textarea value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} placeholder="Add a progress update..." className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg min-h-[60px] resize-none focus:outline-none focus:border-[var(--primary)] text-sm" />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAddUpdate(commitment.id)} className="px-3 py-1.5 bg-[var(--primary)] text-white rounded text-xs hover:opacity-90">Post Update</button>
                      <button onClick={() => { setShowUpdateForm(null); setUpdateContent(''); }} className="px-3 py-1.5 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowUpdateForm(commitment.id)} className="mt-3 flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"><Plus size={14} />Add Update</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
