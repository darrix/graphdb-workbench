PluginRegistry.add('guide.step', [
    {
        guideBlockName: 'enable-autocomplete',
        getSteps: (options, services) => {
            const GuideUtils = services.GuideUtils;
            options.mainAction = 'enable-autocomplete';

            return [
                {
                    guideBlockName: 'click-main-menu',
                    options: angular.extend({}, {
                        menu: 'autocomplete',
                        showIntro: true
                    }, options)
                }, {
                guideBlockName: 'clickable-element',
                options: angular.extend({}, {
                    content: 'guide.step_plugin.enable-autocomplete.content',
                    url: '/autocomplete',
                    elementSelector: GuideUtils.getGuideElementSelector('autocompleteCheckbox'),
                    onNextClick: (guide) => {
                        GuideUtils.waitFor(GuideUtils.getGuideElementSelector('autocompleteCheckbox', ' input'), 3, false)
                            .then(autocompleteCheckbox => {
                                if (!autocompleteCheckbox.is(':checked')) {
                                    GuideUtils.clickOnGuideElement('autocompleteCheckbox')();
                                }
                            });
                        guide.next();
                    }
                }, options)
            },
                {
                    guideBlockName: 'read-only-element',
                    options: angular.extend({}, {
                        content: 'guide.step_plugin.enable-autocomplete.status_info.content',
                        url: '/autocomplete',
                        elementSelector: GuideUtils.getGuideElementSelector('autocompleteStatus')
                    }, options)
                }
            ]
        }
    }
]);
