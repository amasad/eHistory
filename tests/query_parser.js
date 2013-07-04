describe('query parser', function () {

  describe('plain text', function () {

    it('should handle plain text', function () {
      var options = parseQuery('foo');
      expect(options).to.eql({
        settings: {
          startTime: null
        , endTime: null
        , text: 'foo'
        }
      , filters: {}
      });
    });

    it('should handle plain text with special chars', function () {
      var options = parseQuery('foo   + bar');
      expect(options).to.eql({
        settings: {
          startTime: null
        , endTime: null
        , text: 'foo + bar'
        }
      , filters: {}
      });
    });

  });

  describe('filters', function () {

    describe('simple filtes', function () {

      it('should handle title filter', function () {
        var options = parseQuery('intitle:wat');
        expect(options).to.eql({
          settings: {
            startTime: null
          , endTime: null
          , text: 'wat'
          }
        , filters: {
            intitle: 'wat'
          }
        });
      });

      it('should handle site filter', function () {
        var options = parseQuery('site:google.com');
        expect(options).to.eql({
          settings: {
            startTime: null
          , endTime: null
          , text: 'google.com'
          }
        , filters: {
            site: 'google.com'
          }
        });
      });

      it('should handle url filter', function () {
        var options = parseQuery('inurl:foobar');
        expect(options).to.eql({
          settings: {
            startTime: null
          , endTime: null
          , text: 'foobar'
          }
        , filters: {
            inurl: 'foobar'
          }
        });
      });

      it('should handle startTime filter', function () {
        var options = parseQuery('startTime:13-10-20');
        expect(options).to.eql({
          settings: {
            startTime: '13-10-20'
          , endTime: null
          , text: ''
          }
        , filters: {}
        });
      });

      it('should handle endTime filter', function () {
        var options = parseQuery('endTime:13-10-20');
        expect(options).to.eql({
          settings: {
            startTime: null
          , endTime: '13-10-20'
          , text: ''
          }
        , filters: {}
        });
      });

      it('should ignore unknown filter', function () {
        var options = parseQuery('foo:bar');
        expect(options).to.eql({
          settings: {
            startTime: null
          , endTime: null
          , text: 'foo:bar'
          }
        , filters: {}
        });
      });
    });

    describe('multi filters', function () {

      it('should handle time filters', function () {
        var options = parseQuery('endTime:13-10-20 startTime:1/1/1');
        expect(options).to.eql({
          settings: {
            startTime: '1/1/1'
          , endTime: '13-10-20'
          , text: ''
          }
        , filters: {}
        });
      });

      it('should handle time filters and site', function () {
        var options = parseQuery('endTime:13-10-20 startTime:1/1/1 site:wat.com');
        expect(options).to.eql({
          settings: {
            startTime: '1/1/1'
          , endTime: '13-10-20'
          , text: 'wat.com'
          }
        , filters: {
            site: 'wat.com'
          }
        });
      });

      it('should handle time filters and site', function () {
        var options = parseQuery('endTime:13-10-20 startTime:1/1/1 site:wat.com inurl:shitmang');
        expect(options).to.eql({
          settings: {
            startTime: '1/1/1'
          , endTime: '13-10-20'
          , text: 'wat.com shitmang'
          }
        , filters: {
            site: 'wat.com'
          , inurl: 'shitmang'
          }
        });
      });

    });

  });

  describe('plain text + filters', function () {

    it('should handle time filters and text', function () {
      var options = parseQuery('endTime:13-10-20 startTime:1/1/1 shitmang');
      expect(options).to.eql({
        settings: {
          startTime: '1/1/1'
        , endTime: '13-10-20'
        , text: 'shitmang'
        }
      , filters: {
        }
      });
    });

    it('should handle inurl + text', function () {
      var options = parseQuery('inurl:hah shitmang');
      expect(options).to.eql({
        settings: {
          startTime: null
        , endTime: null
        , text: 'hah shitmang'
        }
      , filters: {
          inurl: 'hah'
        }
      });
    });

    it('should handle inurl + ignored filter', function () {
      var options = parseQuery('inurl:hah shit:mang');
      expect(options).to.eql({
        settings: {
          startTime: null
        , endTime: null
        , text: 'hah shit:mang'
        }
      , filters: {
          inurl: 'hah'
        }
      });

    });

  });

});
