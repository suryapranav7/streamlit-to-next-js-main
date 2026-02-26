"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { teacherApi, type CourseOutcome, type ProgramOutcome } from "@/lib/api-client";
import { Loader2, Target, Link as LinkIcon, Grid3X3, Save, Plus, Trash2, AlertCircle, Sparkles } from "lucide-react";

interface ModuleCOMapping {
  module_id: string;
  co_ids: string[];
}

const SUBJECTS = ["Data Structures (DS203)", "Discrete Math (DM201)"];
// const MODULES = ["DS-U1", "DS-U2", "DS-U3", "DS-Final"]; // Removed hardcoded modules

export function OutcomesManager() {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [modules, setModules] = useState<string[]>([]);
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>([]);
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [moduleMappings, setModuleMappings] = useState<ModuleCOMapping[]>([]);
  const [copoMatrix, setCopoMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoMapping, setIsAutoMapping] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string[]> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjectCode = selectedSubject.includes("DS203") ? "DS203" : "DM201";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch Course Outcomes
        const coData = await teacherApi.getCourseOutcomes(subjectCode);
        setCourseOutcomes(coData);

        // Fetch Program Outcomes
        const poData = await teacherApi.getProgramOutcomes();
        setProgramOutcomes(poData);

        // Fetch Modules Dynamically
        const moduleList = await teacherApi.getOBEModules(subjectCode);
        setModules(moduleList);

        // Fetch Module-CO Mappings
        const mappingData = await teacherApi.getModuleCOMappings(subjectCode);
        // Convert to our format
        const mappingsFormatted: ModuleCOMapping[] = moduleList.map(moduleId => {
          const moduleMapping = mappingData.filter((m: { module_id: string }) => m.module_id === moduleId);
          return {
            module_id: moduleId,
            co_ids: moduleMapping.map((m: { co_id: string }) => m.co_id),
          };
        });
        setModuleMappings(mappingsFormatted);

        // Fetch CO-PO Mappings
        const copoData = await teacherApi.getCOPOMappings(subjectCode);
        // Convert to matrix format
        const matrix: Record<string, Record<string, boolean>> = {};
        coData.forEach((co: CourseOutcome) => {
          matrix[co.co_id] = {};
          poData.forEach((po: ProgramOutcome) => {
            const mapping = copoData.find((m: { co_id: string; po_id: string }) =>
              m.co_id === co.co_id && m.po_id === po.po_id
            );
            matrix[co.co_id][po.po_id] = mapping ? mapping.weight > 0 : false;
          });
        });
        setCopoMatrix(matrix);
      } catch (err) {
        console.error("[v0] Failed to fetch OBE data:", err);
        setError(err instanceof Error ? err.message : "Failed to load OBE configuration");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSubject, subjectCode]);

  const updateModuleMapping = (moduleId: string, selectedCOs: string[]) => {
    setModuleMappings((prev) =>
      prev.map((m) =>
        m.module_id === moduleId ? { ...m, co_ids: selectedCOs } : m
      )
    );
  };

  const toggleCOPOMapping = (coId: string, poId: string) => {
    setCopoMatrix((prev) => ({
      ...prev,
      [coId]: {
        ...prev[coId],
        [poId]: !prev[coId]?.[poId],
      },
    }));
  };

  const handleSaveModuleMapping = async (moduleId: string) => {
    const mapping = moduleMappings.find((m) => m.module_id === moduleId);
    if (!mapping) return;

    setIsSaving(true);
    try {
      await teacherApi.saveModuleCOMapping(moduleId, mapping.co_ids);
    } catch (err) {
      console.error("[v0] Failed to save module mapping:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSuggest = async () => {
    setIsAutoMapping(true);
    try {
      const data = await teacherApi.autoSuggestCOMappings(subjectCode);
      setSuggestions(data);

      setModuleMappings((prev) =>
        prev.map((m) => {
          const suggestedCOs = data[m.module_id];

          // Apply suggestions if available (Overwrite behavior like Streamlit)
          if (suggestedCOs && suggestedCOs.length > 0) {
            // Validate that suggested IDs exist in courseOutcomes
            const validCOs = suggestedCOs.filter((id) =>
              courseOutcomes.some((co) => co.co_id === id)
            );
            // If valid suggestions exist, use them. Otherwise keep existing.
            return validCOs.length > 0 ? { ...m, co_ids: validCOs } : m;
          }
          return m;
        })
      );
    } catch (err) {
      console.error("[v0] Auto-suggest failed:", err);
      // Ideally show a toast here, but we'll rely on console/UI state for now
    } finally {
      setIsAutoMapping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Failed to Load OBE Configuration</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure the backend OBE endpoints are available at {process.env.NEXT_PUBLIC_TEACHER_API_URL || "http://localhost:8001"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Outcome Based Education (OBE) Manager
          </h2>
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="cos" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="cos" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Course Outcomes
          </TabsTrigger>
          <TabsTrigger value="mappings" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Map Assessments
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            CO-PO Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cos" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Outcomes for {subjectCode}</CardTitle>
              <CardDescription>
                Defined learning outcomes (Read Only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courseOutcomes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No Course Outcomes defined yet. Please contact admin to seed pilot data.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">CO Code</TableHead>
                      <TableHead>Description (Action Verb + Topic)</TableHead>
                      <TableHead className="w-[100px]">ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseOutcomes.map((co) => (
                      <TableRow key={co.co_id}>
                        <TableCell>
                          <Badge variant="outline">{co.co_code}</Badge>
                        </TableCell>
                        <TableCell>
                          {co.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {co.co_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Map Assessments */}
        <TabsContent value="mappings" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Map Modules to COs</CardTitle>
              <CardDescription>Rule: Max 3 COs per Module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-dashed">
                <Button
                  onClick={handleAutoSuggest}
                  disabled={isAutoMapping}
                  className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                >
                  {isAutoMapping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Auto-Map with AI
                    </>
                  )}
                </Button>
                {suggestions && (
                  <div className="text-sm text-violet-600 flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Suggestions applied to empty fields. Please review and update.</span>
                  </div>
                )}
              </div>

              <Accordion type="multiple" value={modules} className="w-full">
                {modules.map((moduleId) => {
                  const mapping = moduleMappings.find((m) => m.module_id === moduleId);
                  const selectedCOs = mapping?.co_ids || [];

                  return (
                    <AccordionItem key={moduleId} value={moduleId}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span>{moduleId}</span>
                          <Badge variant="secondary" className="ml-2">
                            {selectedCOs.length} COs
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {courseOutcomes.map((co) => (
                              <div
                                key={co.co_id}
                                className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${selectedCOs.includes(co.co_id)
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-muted"
                                  }`}
                                onClick={() => {
                                  const newSelected = selectedCOs.includes(co.co_id)
                                    ? selectedCOs.filter((id) => id !== co.co_id)
                                    : selectedCOs.length < 3
                                      ? [...selectedCOs, co.co_id]
                                      : selectedCOs;
                                  updateModuleMapping(moduleId, newSelected);
                                }}
                              >
                                <Checkbox
                                  checked={selectedCOs.includes(co.co_id)}
                                  disabled={
                                    !selectedCOs.includes(co.co_id) &&
                                    selectedCOs.length >= 3
                                  }
                                />
                                <span className="text-sm">
                                  {co.co_code}: {co.description.substring(0, 30)}...
                                </span>
                              </div>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSaveModuleMapping(moduleId)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              `Update ${moduleId}`
                            )}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CO-PO Mapping Matrix</CardTitle>
              <CardDescription>
                Map Course Outcomes to Program Outcomes (Read Only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background min-w-[200px]">
                        Course Outcome
                      </TableHead>
                      {programOutcomes.map((po) => (
                        <TableHead key={po.po_id} className="text-center min-w-[60px]">
                          <div className="flex flex-col items-center">
                            <span title={po.title}>{po.po_id}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseOutcomes.map((co) => (
                      <TableRow key={co.co_id}>
                        <TableCell className="sticky left-0 bg-background font-medium">
                          <div className="max-w-[300px] whitespace-normal" title={co.description}>
                            {co.description}
                          </div>
                        </TableCell>
                        {programOutcomes.map((po) => (
                          <TableCell key={po.po_id} className="text-center">
                            {copoMatrix[co.co_id]?.[po.po_id] ? (
                              <Badge variant="default" className="w-4 h-4 p-0 rounded-full" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* PO Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Reference: Program Outcomes (NBA)</CardTitle>
              <CardDescription>Standard definitions for B.Tech CSE</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO ID</TableHead>
                    <TableHead>Short Title</TableHead>
                    <TableHead>Full Definition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programOutcomes.map((po) => (
                    <TableRow key={po.po_id}>
                      <TableCell className="font-medium">{po.po_id}</TableCell>
                      <TableCell>{po.title}</TableCell>
                      <TableCell className="text-muted-foreground">{po.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
