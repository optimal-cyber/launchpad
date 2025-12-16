<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        <div class="optimal-branding">
            <svg class="optimal-logo" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Shield shape -->
                <path d="M60 10L15 30V55C15 82.5 33 107.5 60 115C87 107.5 105 82.5 105 55V30L60 10Z"
                      stroke="#06b6d4" stroke-width="3" fill="none"/>
                <!-- Inner network nodes -->
                <circle cx="60" cy="45" r="6" fill="#06b6d4"/>
                <circle cx="40" cy="65" r="5" fill="#3b82f6"/>
                <circle cx="80" cy="65" r="5" fill="#3b82f6"/>
                <circle cx="50" cy="85" r="4" fill="#06b6d4" opacity="0.7"/>
                <circle cx="70" cy="85" r="4" fill="#06b6d4" opacity="0.7"/>
                <!-- Connection lines -->
                <line x1="60" y1="45" x2="40" y2="65" stroke="#06b6d4" stroke-width="1.5" opacity="0.6"/>
                <line x1="60" y1="45" x2="80" y2="65" stroke="#06b6d4" stroke-width="1.5" opacity="0.6"/>
                <line x1="40" y1="65" x2="50" y2="85" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/>
                <line x1="80" y1="65" x2="70" y2="85" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/>
                <line x1="40" y1="65" x2="80" y2="65" stroke="#06b6d4" stroke-width="1.5" opacity="0.4"/>
                <line x1="50" y1="85" x2="70" y2="85" stroke="#06b6d4" stroke-width="1.5" opacity="0.4"/>
            </svg>
            <h1 class="optimal-title">OPTIMAL</h1>
            <p class="optimal-tagline">Unified Security & Compliance Platform</p>
        </div>
    </#if>

    <#if section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <h2 class="login-title">Sign In To Your Account</h2>
                <p class="login-subtitle">Please use your Optimal credentials to access the platform.</p>

                <#if realm.password>
                    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                        <div class="form-group">
                            <label for="username">
                                <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                            </label>
                            <input tabindex="1" id="username" class="form-control" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off"
                                   aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                            />
                            <#if messagesPerField.existsError('username','password')>
                                <span class="error-message" aria-live="polite">
                                    ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <div class="form-group">
                            <label for="password">${msg("password")}</label>
                            <div class="password-wrapper">
                                <input tabindex="2" id="password" class="form-control" name="password" type="password" autocomplete="off"
                                       aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                                />
                                <button type="button" class="password-toggle" onclick="togglePassword()" tabindex="3">
                                    <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="form-group form-options">
                            <#if realm.rememberMe && !usernameHidden??>
                                <div class="checkbox">
                                    <label>
                                        <#if login.rememberMe??>
                                            <input tabindex="4" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                                        <#else>
                                            <input tabindex="4" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                                        </#if>
                                    </label>
                                </div>
                            </#if>
                        </div>

                        <div class="form-group">
                            <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                            <input tabindex="5" class="btn-login" name="login" id="kc-login" type="submit" value="OPTIMAL SSO"/>
                        </div>

                        <#if realm.resetPasswordAllowed>
                            <div class="form-group forgot-password">
                                <a tabindex="6" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                            </div>
                        </#if>
                    </form>
                </#if>

                <#if realm.password && social.providers??>
                    <div id="kc-social-providers">
                        <div class="social-divider">
                            <span>or continue with</span>
                        </div>
                        <ul>
                            <#list social.providers as p>
                                <li>
                                    <a id="social-${p.alias}" href="${p.loginUrl}">
                                        <span class="social-icon">${p.displayName}</span>
                                    </a>
                                </li>
                            </#list>
                        </ul>
                    </div>
                </#if>
            </div>
        </div>

        <script>
            function togglePassword() {
                var passwordInput = document.getElementById('password');
                var eyeIcon = document.getElementById('eye-icon');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
                }
            }
        </script>
    </#if>
</@layout.registrationLayout>
