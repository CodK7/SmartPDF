import { Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/design-system/components/button";
import { Field, Input, Textarea } from "@/design-system/components/field";
import { directionForCv } from "@/domain/documents/cv-format";
import type { CvDocument, CvEducation, CvExperience, Locale } from "@/domain/documents/types";
import { MonthYearField } from "./month-year-field";
import { ProfilePhotoField } from "./profile-photo-field";
import { EditorSection } from "./section";
import { SkillsInput } from "./skills-input";

const copy = {
  ar: {
    basics: "المعلومات الأساسية", summary: "الملخص المهني", experience: "الخبرة", education: "التعليم والمهارات",
    addExperience: "إضافة خبرة", remove: "حذف", name: "الاسم الكامل", headline: "المسمى المهني",
    specialization: "التخصص / المجال المهني", email: "البريد الإلكتروني", phone: "الهاتف", location: "الموقع",
    summaryLabel: "الملخص", company: "الشركة", role: "الدور", start: "تاريخ البدء", end: "تاريخ الانتهاء",
    achievement: "إنجاز أو مسؤولية", photo: "إضافة صورة", current: "أعمل هنا حاليًا",
    educationEntry: "المؤهل العلمي", addEducation: "إضافة مؤهل", institution: "الجهة التعليمية", degree: "الدرجة / التخصص",
  },
  en: {
    basics: "Basics", summary: "Professional summary", experience: "Experience", education: "Education & skills",
    addExperience: "Add experience", remove: "Remove", name: "Full name", headline: "Professional headline",
    specialization: "Specialization / professional field", email: "Email", phone: "Phone", location: "Location",
    summaryLabel: "Summary", company: "Company", role: "Role", start: "Start date", end: "End date",
    achievement: "Achievement or responsibility", photo: "Profile Photo", current: "I currently work here",
    educationEntry: "Education", addEducation: "Add education", institution: "Institution", degree: "Degree / field of study",
  },
} as const;

export function CvForm({ document, locale, update }: { document: CvDocument; locale: Locale; update: (next: CvDocument) => void }) {
  const c = document.content;
  const text = copy[locale];
  const patch = (value: Partial<typeof c>) => {
    const content = { ...c, ...value };
    update({ ...document, direction: directionForCv(content, document.direction), content });
  };
  const updateExperience = (id: string, value: Partial<CvExperience>) => patch({ experiences: c.experiences.map((item) => item.id === id ? { ...item, ...value } : item) });
  const updateEducation = (id: string, value: Partial<CvEducation>) => patch({ education: c.education.map((item) => item.id === id ? { ...item, ...value } : item) });

  return <>
    <EditorSection title={text.photo}><ProfilePhotoField locale={locale} value={c.profilePhotoDataUrl} onChange={(profilePhotoDataUrl) => patch({ profilePhotoDataUrl })} /></EditorSection>
    <EditorSection title={text.basics}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fullName" label={text.name}><Input id="fullName" dir="auto" maxLength={160} value={c.fullName} onChange={(event) => patch({ fullName: event.target.value })} /></Field>
        <Field id="headline" label={text.headline}><Input id="headline" dir="auto" maxLength={160} value={c.headline} onChange={(event) => patch({ headline: event.target.value })} /></Field>
        <Field id="specialization" label={text.specialization}><Input id="specialization" dir="auto" maxLength={160} value={c.specialization} onChange={(event) => patch({ specialization: event.target.value })} /></Field>
        <Field id="email" label={text.email}><Input id="email" type="email" dir="ltr" maxLength={254} value={c.email} onChange={(event) => patch({ email: event.target.value })} /></Field>
        <Field id="phone" label={text.phone}><Input id="phone" type="tel" dir="ltr" maxLength={160} value={c.phone} onChange={(event) => patch({ phone: event.target.value })} /></Field>
        <Field id="location" label={text.location}><Input id="location" dir="auto" maxLength={160} value={c.location} onChange={(event) => patch({ location: event.target.value })} /></Field>
      </div>
    </EditorSection>
    <EditorSection title={text.summary}><Field id="summary" label={text.summaryLabel}><Textarea id="summary" dir="auto" maxLength={5000} value={c.summary} onChange={(event) => patch({ summary: event.target.value })} /></Field></EditorSection>
    <EditorSection title={text.experience}>
      <div className="grid gap-5">{c.experiences.map((experience, index) => <div key={experience.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{text.experience} {index + 1}</h3><Button variant="ghost" onClick={() => patch({ experiences: c.experiences.filter(({ id }) => id !== experience.id) })}><Trash size={18} />{text.remove}</Button></div>
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={"company-" + experience.id} label={text.company}><Input id={"company-" + experience.id} dir="auto" maxLength={160} value={experience.company} onChange={(event) => updateExperience(experience.id, { company: event.target.value })} /></Field>
            <Field id={"role-" + experience.id} label={text.role}><Input id={"role-" + experience.id} dir="auto" maxLength={160} value={experience.role} onChange={(event) => updateExperience(experience.id, { role: event.target.value })} /></Field>
          </div>
          <div className="grid gap-4">
            <MonthYearField id={"start-" + experience.id} label={text.start} locale={locale} value={experience.startDate} onChange={(startDate) => updateExperience(experience.id, { startDate })} />
            <MonthYearField id={"end-" + experience.id} label={text.end} locale={locale} value={experience.endDate} disabled={experience.current} onChange={(endDate) => updateExperience(experience.id, { endDate })} />
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm font-semibold"><input type="checkbox" checked={experience.current} onChange={(event) => updateExperience(experience.id, { current: event.target.checked, endDate: event.target.checked ? "" : experience.endDate })} className="size-5 accent-[var(--color-action)]" />{text.current}</label>
          </div>
          <div className="border-t border-[var(--color-border)] pt-5"><Field id={"bullet-" + experience.id} label={text.achievement}><Textarea id={"bullet-" + experience.id} dir="auto" maxLength={6011} value={experience.bullets.join("\n")} onChange={(event) => updateExperience(experience.id, { bullets: event.target.value.split(/\r?\n/).slice(0, 12).map((line) => line.slice(0, 500)) })} /></Field></div>
        </div>
      </div>)}</div>
      <Button variant="secondary" onClick={() => patch({ experiences: [...c.experiences, { id: crypto.randomUUID(), company: "", role: "", startDate: "", endDate: "", current: false, bullets: [""] }] })}><Plus size={18} />{text.addExperience}</Button>
    </EditorSection>
    <EditorSection title={text.education}>
      <div className="grid gap-5">{c.education.map((education, index) => <div key={education.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{text.educationEntry} {index + 1}</h3><Button variant="ghost" onClick={() => patch({ education: c.education.filter(({ id }) => id !== education.id) })}><Trash size={18} />{text.remove}</Button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={"education-institution-" + education.id} label={text.institution}><Input id={"education-institution-" + education.id} dir="auto" maxLength={160} value={education.institution} onChange={(event) => updateEducation(education.id, { institution: event.target.value })} /></Field>
          <Field id={"education-degree-" + education.id} label={text.degree}><Input id={"education-degree-" + education.id} dir="auto" maxLength={160} value={education.degree} onChange={(event) => updateEducation(education.id, { degree: event.target.value })} /></Field>
          <MonthYearField id={"education-start-" + education.id} label={text.start} locale={locale} value={education.startDate} onChange={(startDate) => updateEducation(education.id, { startDate })} />
          <MonthYearField id={"education-end-" + education.id} label={text.end} locale={locale} value={education.endDate} onChange={(endDate) => updateEducation(education.id, { endDate })} />
        </div>
      </div>)}</div>
      <Button variant="secondary" onClick={() => patch({ education: [...c.education, { id: crypto.randomUUID(), institution: "", degree: "", startDate: "", endDate: "" }] })}><Plus size={18} />{text.addEducation}</Button>
      <div className="border-t border-[var(--color-border)] pt-5"><SkillsInput id="skills" locale={locale} value={c.skills} onChange={(skills) => patch({ skills })} /></div>
    </EditorSection>
  </>;
}
