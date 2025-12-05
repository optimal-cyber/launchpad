{{/*
Expand the name of the chart.
*/}}
{{- define "optimal-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "optimal-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "optimal-platform.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "optimal-platform.labels" -}}
helm.sh/chart: {{ include "optimal-platform.chart" . }}
{{ include "optimal-platform.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "optimal-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "optimal-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "optimal-platform.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "optimal-platform.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Portal labels
*/}}
{{- define "optimal-platform.portal.labels" -}}
{{ include "optimal-platform.labels" . }}
app.kubernetes.io/component: portal
{{- end }}

{{/*
Portal selector labels
*/}}
{{- define "optimal-platform.portal.selectorLabels" -}}
{{ include "optimal-platform.selectorLabels" . }}
app.kubernetes.io/component: portal
{{- end }}

{{/*
API Gateway labels
*/}}
{{- define "optimal-platform.apiGateway.labels" -}}
{{ include "optimal-platform.labels" . }}
app.kubernetes.io/component: api-gateway
{{- end }}

{{/*
API Gateway selector labels
*/}}
{{- define "optimal-platform.apiGateway.selectorLabels" -}}
{{ include "optimal-platform.selectorLabels" . }}
app.kubernetes.io/component: api-gateway
{{- end }}

{{/*
SBOM Service labels
*/}}
{{- define "optimal-platform.sbomService.labels" -}}
{{ include "optimal-platform.labels" . }}
app.kubernetes.io/component: sbom-service
{{- end }}

{{/*
SBOM Service selector labels
*/}}
{{- define "optimal-platform.sbomService.selectorLabels" -}}
{{ include "optimal-platform.selectorLabels" . }}
app.kubernetes.io/component: sbom-service
{{- end }}

{{/*
Vulnerability Service labels
*/}}
{{- define "optimal-platform.vulnService.labels" -}}
{{ include "optimal-platform.labels" . }}
app.kubernetes.io/component: vuln-service
{{- end }}

{{/*
Vulnerability Service selector labels
*/}}
{{- define "optimal-platform.vulnService.selectorLabels" -}}
{{ include "optimal-platform.selectorLabels" . }}
app.kubernetes.io/component: vuln-service
{{- end }}

{{/*
Worker labels
*/}}
{{- define "optimal-platform.worker.labels" -}}
{{ include "optimal-platform.labels" . }}
app.kubernetes.io/component: worker
{{- end }}

{{/*
Worker selector labels
*/}}
{{- define "optimal-platform.worker.selectorLabels" -}}
{{ include "optimal-platform.selectorLabels" . }}
app.kubernetes.io/component: worker
{{- end }}

{{/*
Get the image registry
*/}}
{{- define "optimal-platform.imageRegistry" -}}
{{- if .Values.global.imageRegistry }}
{{- .Values.global.imageRegistry }}/
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL hostname
*/}}
{{- define "optimal-platform.postgresql.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "optimal-platform.fullname" .) }}
{{- else }}
{{- .Values.externalDatabase.host }}
{{- end }}
{{- end }}

{{/*
Return the Redis hostname
*/}}
{{- define "optimal-platform.redis.host" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s-redis-master" (include "optimal-platform.fullname" .) }}
{{- else }}
{{- .Values.externalRedis.host }}
{{- end }}
{{- end }}

