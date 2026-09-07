import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  SparklesIcon,
  WrenchIcon,
  DocumentTextIcon,
  PhotoIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { CustomModelConfig } from './CustomModelConfigModal';

export interface CustomModelTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName?: string;
  initialModels?: string[] | CustomModelConfig[];
  onSaveModels: (models: CustomModelConfig[]) => void;
}

export interface TableRowModel {
  id: string;
  name: string;
  context_length: string;
  modality: string;
  prompt_price: string;
  completion_price: string;
  reasoning: boolean;
  tools: boolean;
  structured_outputs: boolean;
  vision: boolean;
}

const createEmptyRow = (id: string = ''): TableRowModel => ({
  id,
  name: id ? id.split('/').pop() || id : '',
  context_length: '128000',
  modality: 'text->text',
  prompt_price: '',
  completion_price: '',
  reasoning: /r1|reason|o1|o3/i.test(id),
  tools: true,
  structured_outputs: true,
  vision: false,
});

export const CustomModelTableModal: React.FC<CustomModelTableModalProps> = ({
  isOpen,
  onClose,
  providerName = 'Custom Provider',
  initialModels = [],
  onSaveModels,
}) => {
  const [rows, setRows] = useState<TableRowModel[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialModels && initialModels.length > 0) {
      const parsedRows: TableRowModel[] = initialModels.map((m) => {
        if (typeof m === 'string') {
          return createEmptyRow(m);
        }
        const supp = Array.isArray(m.supported_parameters) ? m.supported_parameters : [];
        return {
          id: m.id || '',
          name: m.name || m.id || '',
          context_length: m.context_length ? String(m.context_length) : '128000',
          modality: m.architecture?.modality || 'text->text',
          prompt_price: m.pricing?.prompt ? String(m.pricing.prompt) : '',
          completion_price: m.pricing?.completion ? String(m.pricing.completion) : '',
          reasoning: Boolean(m.reasoning || supp.includes('reasoning') || /r1|reason|o1|o3/i.test(m.id)),
          tools: supp.includes('tools') || supp.includes('tool_choice') || true,
          structured_outputs: supp.includes('structured_outputs') || supp.includes('json_mode') || true,
          vision: supp.includes('vision') || (m.architecture?.modality || '').includes('image'),
        };
      });
      setRows(parsedRows);
    } else {
      setRows([createEmptyRow()]);
    }
  }, [isOpen, initialModels]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: keyof TableRowModel, value: any) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [field]: value };
        if (field === 'id' && !row.name) {
          updated.name = value.split('/').pop() || value;
          if (/r1|reason|o1|o3/i.test(value)) {
            updated.reasoning = true;
          }
        }
        if (field === 'vision' && value) {
          updated.modality = 'text+image->text';
        }
        return updated;
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter((r) => r.id.trim().length > 0);
    if (validRows.length === 0) {
      toast.error('Please enter a valid Model ID before saving');
      return;
    }

    const cleanedConfigs: CustomModelConfig[] = validRows.map((r) => {
      const supportedParams: string[] = [];
      if (r.tools) supportedParams.push('tools', 'tool_choice');
      if (r.structured_outputs) supportedParams.push('structured_outputs', 'json_mode');
      if (r.vision) supportedParams.push('vision', 'image_input');
      if (r.reasoning) supportedParams.push('reasoning');

      return {
        id: r.id.trim(),
        name: r.name.trim() || r.id.trim(),
        context_length: r.context_length ? parseInt(r.context_length, 10) || null : null,
        architecture: {
          modality: r.vision ? 'text+image->text' : r.modality,
        },
        pricing:
          r.prompt_price || r.completion_price
            ? {
                prompt: r.prompt_price ? parseFloat(r.prompt_price) : null,
                completion: r.completion_price ? parseFloat(r.completion_price) : null,
              }
            : null,
        supported_parameters: supportedParams.length > 0 ? supportedParams : null,
        reasoning: r.reasoning,
      };
    });

    onSaveModels(cleanedConfigs);
    toast.success('Model list saved successfully');
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center pb-8 sm:pb-12 px-4 bg-black/50 backdrop-blur-sm animate-apple-fade font-sans select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#14151b] border border-[#232530] rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl animate-apple-scale flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232530] bg-[#16171d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c0f200]/10 border border-[#c0f200]/20 flex items-center justify-center text-[#c0f200] shrink-0">
              <TableCellsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Custom Models Table &mdash; {providerName}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Add and configure model IDs, context windows, token pricing, and capability flags in a single table.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/50 cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Table Content */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#101116] sticky top-0 z-10 border-b border-[#232530] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Model ID *</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Display Name</th>
                  <th className="py-2.5 px-3 w-28">Context (Tokens)</th>
                  <th className="py-2.5 px-3 w-40">Pricing ($/1M Input/Output)</th>
                  <th className="py-2.5 px-3 min-w-[200px] text-center">Capabilities</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2029]">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-white/[0.02] transition-colors group/row"
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center text-zinc-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Model ID */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        required
                        placeholder="e.g. meta-llama/llama-3.3-70b"
                        value={row.id}
                        onChange={(e) => handleUpdateRow(idx, 'id', e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-md px-2.5 py-1.5 font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors text-xs"
                      />
                    </td>

                    {/* Display Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. LLaMA 3.3 70B"
                        value={row.name}
                        onChange={(e) => handleUpdateRow(idx, 'name', e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-md px-2.5 py-1.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors text-xs"
                      />
                    </td>

                    {/* Context Length */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        placeholder="128000"
                        value={row.context_length}
                        onChange={(e) => handleUpdateRow(idx, 'context_length', e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-md px-2 py-1.5 font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors text-xs"
                      />
                    </td>

                    {/* Pricing */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="0.15"
                          value={row.prompt_price}
                          onChange={(e) => handleUpdateRow(idx, 'prompt_price', e.target.value)}
                          className="w-1/2 bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-md px-2.5 py-1.5 font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none text-xs"
                          title="Input $/1M"
                        />
                        <span className="text-zinc-600">/</span>
                        <input
                          type="text"
                          placeholder="0.60"
                          value={row.completion_price}
                          onChange={(e) => handleUpdateRow(idx, 'completion_price', e.target.value)}
                          className="w-1/2 bg-[#0d1117] border border-[#2d3340] focus:border-[#c0f200]/70 rounded-md px-2.5 py-1.5 font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none text-xs"
                          title="Output $/1M"
                        />
                      </div>
                    </td>

                    {/* Capabilities Tags */}
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Reasoning */}
                        <button
                          type="button"
                          onClick={() => handleUpdateRow(idx, 'reasoning', !row.reasoning)}
                          title="Supports Reasoning / Thinking"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            row.reasoning
                              ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                              : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          <SparklesIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Tools */}
                        <button
                          type="button"
                          onClick={() => handleUpdateRow(idx, 'tools', !row.tools)}
                          title="Supports Function Calling & Tools"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            row.tools
                              ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                              : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          <WrenchIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Structured Outputs */}
                        <button
                          type="button"
                          onClick={() => handleUpdateRow(idx, 'structured_outputs', !row.structured_outputs)}
                          title="Supports Structured Outputs & JSON Schema"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            row.structured_outputs
                              ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                              : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Vision */}
                        <button
                          type="button"
                          onClick={() => handleUpdateRow(idx, 'vision', !row.vision)}
                          title="Supports Vision & Multimodal Inputs"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            row.vision
                              ? 'bg-[#c0f200]/15 border-[#c0f200]/40 text-[#c0f200] shadow-xs'
                              : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          <PhotoIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Delete */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={rows.length === 1}
                        className="text-zinc-600 hover:text-rose-400 transition-colors p-1 rounded-md hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Remove row"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Action Bar */}
          <div className="px-6 py-3 bg-[#101116] border-t border-[#232530] flex items-center justify-between shrink-0">
            {/* Left side: Cancel button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Right side: Add New Model + Save Model List */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#2d3340] hover:border-[#c0f200]/60 bg-[#16171d] hover:bg-[#20222c] text-zinc-300 hover:text-[#c0f200] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <PlusIcon className="w-3.5 h-3.5 text-[#c0f200]" />
                <span>Add New Model</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#c0f200] hover:bg-[#a6d100] text-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Model List</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
