# Deployment Checklist

This checklist ensures a successful and safe deployment of the AWS API Gateway + Lambda application.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass locally (`npm test`)
- [ ] Code linting passes (`npm run lint`)
- [ ] Code formatting is consistent (`npm run format`)
- [ ] TypeScript compilation succeeds (`npm run build`)
- [ ] No security vulnerabilities in dependencies (`npm audit`)

### Code Review
- [ ] Code changes have been peer reviewed
- [ ] Pull request has been approved
- [ ] All CI/CD checks pass
- [ ] Documentation has been updated if needed

### Environment Preparation
- [ ] AWS credentials are configured and valid
- [ ] Terraform backend is configured (for production)
- [ ] Environment-specific variables are set
- [ ] Required AWS permissions are available

### Infrastructure Validation
- [ ] Terraform configuration is valid (`terraform validate`)
- [ ] Terraform plan has been reviewed (`terraform plan`)
- [ ] No unexpected resource changes
- [ ] Cost implications have been considered

## Deployment Process

### Development Environment
- [ ] Deploy to development environment
  ```bash
  npm run deploy:dev
  ```
- [ ] Verify deployment outputs
- [ ] Run health checks
  ```bash
  ./scripts/health-check.sh <dev-api-url> dev
  ```
- [ ] Run integration tests against deployed API
- [ ] Verify all endpoints work correctly

### Staging Environment
- [ ] Deploy to staging environment
  ```bash
  npm run deploy:staging
  ```
- [ ] Verify deployment outputs
- [ ] Run comprehensive health checks
- [ ] Run full test suite against staging
- [ ] Performance testing (if applicable)
- [ ] Security testing (if applicable)
- [ ] User acceptance testing (if applicable)

### Production Environment
- [ ] Final review of changes
- [ ] Stakeholder approval for production deployment
- [ ] Deploy to production environment
  ```bash
  npm run deploy:prod
  ```
- [ ] Verify deployment outputs
- [ ] Run production health checks
- [ ] Monitor initial traffic and metrics

## Post-Deployment Verification

### Immediate Verification (0-15 minutes)
- [ ] API Gateway is accessible
- [ ] All Lambda functions are deployed and active
- [ ] Health checks pass for all endpoints
  ```bash
  ./scripts/verify-deployment.sh prod <api-url>
  ```
- [ ] CORS functionality works correctly
- [ ] Error handling works as expected
- [ ] Response times are acceptable

### Short-term Monitoring (15 minutes - 2 hours)
- [ ] CloudWatch metrics show normal operation
- [ ] No error spikes in Lambda functions
- [ ] API Gateway metrics are healthy
- [ ] No CloudWatch alarms triggered
- [ ] Log entries look normal

### Extended Monitoring (2-24 hours)
- [ ] Sustained performance under normal load
- [ ] Memory usage is within expected ranges
- [ ] No memory leaks detected
- [ ] Error rates remain low
- [ ] Response times remain consistent

## Rollback Checklist

### When to Rollback
- [ ] Critical functionality is broken
- [ ] Error rates exceed acceptable thresholds
- [ ] Performance degradation is significant
- [ ] Security vulnerabilities are discovered
- [ ] Data integrity issues are detected

### Rollback Process
- [ ] Identify the last known good version
- [ ] Prepare rollback plan
- [ ] Execute rollback
  ```bash
  # Option 1: Terraform rollback
  git checkout <previous-working-commit>
  ./scripts/deploy.sh prod apply
  
  # Option 2: Lambda version rollback
  aws lambda update-alias --function-name <function> --name LIVE --function-version <previous-version>
  ```
- [ ] Verify rollback success
- [ ] Run health checks after rollback
- [ ] Monitor system stability
- [ ] Document rollback reason and process

## Environment-Specific Considerations

### Development Environment
- [ ] Can be deployed automatically on code changes
- [ ] Minimal monitoring required
- [ ] Can be destroyed and recreated easily
- [ ] Used for feature development and testing

### Staging Environment
- [ ] Should mirror production configuration
- [ ] Requires manual deployment approval
- [ ] Full monitoring and alerting
- [ ] Used for final testing before production

### Production Environment
- [ ] Requires multiple approvals
- [ ] Full monitoring and alerting
- [ ] Backup and disaster recovery plans
- [ ] Change management process followed
- [ ] Rollback plan prepared and tested

## Security Checklist

### Pre-Deployment Security
- [ ] No secrets in code or configuration files
- [ ] IAM roles follow principle of least privilege
- [ ] API endpoints have proper authentication (if required)
- [ ] Input validation is implemented
- [ ] CORS is properly configured

### Post-Deployment Security
- [ ] CloudTrail logging is enabled
- [ ] VPC configuration is correct (if applicable)
- [ ] Security groups are properly configured
- [ ] SSL/TLS certificates are valid
- [ ] API rate limiting is working

## Performance Checklist

### Performance Validation
- [ ] API response times are under 2 seconds
- [ ] Lambda cold start times are acceptable
- [ ] Memory usage is optimized
- [ ] Concurrent request handling works
- [ ] Database connections are properly managed (if applicable)

### Load Testing (Production)
- [ ] Gradual traffic increase
- [ ] Monitor key metrics during load increase
- [ ] Verify auto-scaling works (if configured)
- [ ] Test failure scenarios
- [ ] Verify recovery after load testing

## Monitoring and Alerting

### CloudWatch Setup
- [ ] Lambda function metrics are being collected
- [ ] API Gateway metrics are being collected
- [ ] Custom business metrics are being collected
- [ ] Log aggregation is working
- [ ] Dashboards are displaying correctly

### Alerting Configuration
- [ ] Error rate alarms are configured
- [ ] Latency alarms are configured
- [ ] Throttling alarms are configured
- [ ] Custom business metric alarms are configured
- [ ] Notification channels are working

## Documentation Updates

### Technical Documentation
- [ ] API documentation is updated
- [ ] Architecture diagrams are current
- [ ] Deployment procedures are documented
- [ ] Troubleshooting guides are updated

### Operational Documentation
- [ ] Runbooks are updated
- [ ] Monitoring procedures are documented
- [ ] Incident response procedures are current
- [ ] Contact information is up to date

## Communication

### Stakeholder Communication
- [ ] Deployment schedule communicated
- [ ] Expected downtime communicated (if any)
- [ ] Success/failure communicated promptly
- [ ] Post-deployment status updates provided

### Team Communication
- [ ] Development team notified of deployment
- [ ] Operations team notified of new deployment
- [ ] Support team briefed on changes
- [ ] Documentation team notified of updates

## Sign-off

### Development Team
- [ ] Lead Developer: _________________ Date: _________
- [ ] QA Engineer: _________________ Date: _________

### Operations Team
- [ ] DevOps Engineer: _________________ Date: _________
- [ ] Site Reliability Engineer: _________________ Date: _________

### Business Team
- [ ] Product Manager: _________________ Date: _________
- [ ] Business Owner: _________________ Date: _________

## Notes

### Deployment Notes
```
Date: _______________
Environment: _______________
Deployed Version: _______________
API Gateway URL: _______________

Issues Encountered:
_________________________________
_________________________________
_________________________________

Resolution:
_________________________________
_________________________________
_________________________________

Additional Notes:
_________________________________
_________________________________
_________________________________
```

### Post-Deployment Observations
```
Performance Metrics:
- Average Response Time: _______________
- Error Rate: _______________
- Throughput: _______________

Monitoring Status:
- CloudWatch Alarms: _______________
- Dashboard Status: _______________
- Log Analysis: _______________

Next Actions:
_________________________________
_________________________________
_________________________________
```