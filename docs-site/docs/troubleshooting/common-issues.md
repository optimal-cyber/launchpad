---
sidebar_position: 1
title: Common Issues
description: Solutions to common Optimal Platform issues
---

# Common Issues

Solutions to frequently encountered issues.

## Pods Not Starting

### Check Pod Status

```bash
kubectl get pods -n optimal-system
kubectl describe pod <pod-name> -n optimal-system
```

### Common Causes

| Issue | Cause | Solution |
|-------|-------|----------|
| `ImagePullBackOff` | Can't pull image | Check registry credentials, image exists |
| `CrashLoopBackOff` | App crashing | Check logs: `kubectl logs <pod>` |
| `Pending` | No resources | Check node resources, PVC binding |
| `Init:Error` | Init container failed | Check init container logs |

### Check Logs

```bash
# Current logs
kubectl logs <pod-name> -n optimal-system

# Previous container logs (if restarting)
kubectl logs <pod-name> -n optimal-system --previous

# All containers in pod
kubectl logs <pod-name> -n optimal-system --all-containers
```

## Database Connection Issues

### Test Connectivity

```bash
# From API pod
kubectl exec -it <api-pod> -n optimal-system -- nc -zv postgresql 5432

# Check database service
kubectl get svc -n optimal-system | grep postgresql
```

### Common Fixes

1. **Check credentials**: Verify secret values
   ```bash
   kubectl get secret optimal-db-credentials -n optimal-system -o yaml
   ```

2. **Check PostgreSQL pod**: Ensure database is running
   ```bash
   kubectl get pods -n optimal-system | grep postgresql
   ```

3. **Check network policies**: Ensure traffic is allowed
   ```bash
   kubectl get networkpolicies -n optimal-system
   ```

## Ingress Issues

### Check Ingress Controller

```bash
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### Check Ingress Configuration

```bash
kubectl get ingress -n optimal-system
kubectl describe ingress <ingress-name> -n optimal-system
```

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| 503 error | Backend not ready | Check pod readiness |
| 404 error | Path not configured | Check ingress paths |
| SSL error | Certificate issue | Check cert-manager |
| Connection refused | Service misconfigured | Check service selector |

## Kyverno Policy Violations

### View Policy Reports

```bash
kubectl get policyreport -n optimal-system
kubectl describe policyreport -n optimal-system
```

### Check Specific Violations

```bash
# See which policies are failing
kubectl get clusterpolicy
kubectl describe clusterpolicy <policy-name>
```

### Exempt Resources

If needed, create a PolicyException:

```yaml
apiVersion: kyverno.io/v2beta1
kind: PolicyException
metadata:
  name: allow-specific-workload
spec:
  exceptions:
    - policyName: require-run-as-non-root
      ruleNames:
        - run-as-non-root
  match:
    any:
      - resources:
          namespaces:
            - your-namespace
```

## Observability Issues

### Prometheus Not Scraping

```bash
# Check targets
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
# Then visit http://localhost:9090/targets
```

### Loki Not Receiving Logs

```bash
# Check Promtail
kubectl get pods -n logging | grep promtail
kubectl logs -n logging -l app=promtail

# Check Loki
kubectl logs -n logging -l app=loki
```

### Grafana Dashboard Empty

1. Check data source configuration
2. Verify time range
3. Check query syntax

## Velero Backup Issues

### Check Backup Status

```bash
kubectl get backups -n velero
kubectl describe backup <backup-name> -n velero
```

### Check Velero Logs

```bash
kubectl logs -n velero -l app.kubernetes.io/name=velero
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Backup stuck | Storage issue | Check BackupStorageLocation |
| Partial failure | PV snapshot failed | Check VolumeSnapshotLocation |
| Restore failed | Namespace conflict | Delete existing resources first |

## Getting Help

If you can't resolve an issue:

1. **Collect diagnostics**:
   ```bash
   kubectl get events -n optimal-system --sort-by='.lastTimestamp'
   kubectl describe pods -n optimal-system > pods.txt
   ```

2. **Check documentation**: https://docs.gooptimal.io

3. **Open an issue**: https://github.com/optimal-platform/optimal-platform/issues

4. **Contact support**: support@gooptimal.io
